import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { initBridge, exec, runScript, spawnScript, getModuleDir } from './bridge.js'
import type { KsuBridge } from './types.js'

function mockKsu(overrides?: Partial<KsuBridge>) {
  const mock: KsuBridge = {
    exec: vi.fn((_cmd, _opts, _cb) => {}),
    spawn: vi.fn((_cmd, _args, _opts, _name) => {}),
    ...overrides,
  }
  Object.defineProperty(window, 'ksu', { value: mock, configurable: true, writable: true })
  return mock
}

function mockFetchJson(data: unknown) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
  ) as unknown as typeof globalThis.fetch
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  delete (window as any).ksu
  vi.restoreAllMocks()
})

describe('initBridge', () => {
  it('fetches module_paths.json and sets MODULE', async () => {
    mockKsu()
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    await initBridge()
    expect(globalThis.fetch).toHaveBeenCalledWith('/json/module_paths.json')
  })

  it('expands modules_update to modules in the path', async () => {
    mockKsu()
    mockFetchJson({ MODDIR: '/data/adb/modules_update/Specter' })
    await initBridge()
    expect(getModuleDir()).toBe('/data/adb/modules/Specter')
  })

  it('throws when no module path can be determined', async () => {
    mockKsu()
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('fetch fail'))) as unknown as typeof globalThis.fetch
    Object.defineProperty(document, 'currentScript', { value: null, configurable: true })
    await expect(initBridge()).rejects.toThrow('Cannot determine module path')
  })
})

describe('exec', () => {
  it('rejects with typed error when no bridge is available', async () => {
    delete (window as any).ksu
    await expect(exec('echo hi')).rejects.toThrow('no-bridge')
  })

  it('invokes window.ksu.exec with the command', async () => {
    const ksu = mockKsu()
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    await initBridge()
    exec('echo hello')
    expect(ksu.exec).toHaveBeenCalledWith(
      'echo hello',
      '{}',
      expect.stringMatching(/^__sp_/)
    )
  })

  it('resolves with stdout when callback fires synchronously', async () => {
    mockKsu({
      exec(_cmd, _opts, cbName) {
        const cb = (window as any)[cbName]
        cb(0, 'output text', '')
      },
    })
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    await initBridge()
    const result = await exec('test-cmd')
    expect(result).toEqual({ code: 0, stdout: 'output text', stderr: '' })
  })

  it('resolves with parsed JSON when callback receives a JSON string', async () => {
    mockKsu({
      exec(_cmd, _opts, cbName) {
        const cb = (window as any)[cbName]
        cb(JSON.stringify({ result: 'parsed_value', stderr: '' }))
      },
    })
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    await initBridge()
    const result = await exec('json-cmd')
    expect(result.stdout).toBe('parsed_value')
  })
})

describe('runScript', () => {
  it('rejects when no bridge', async () => {
    delete (window as any).ksu
    await expect(runScript('test.sh')).rejects.toThrow('no-bridge')
  })

  it('invokes ksu.exec with sh script path', async () => {
    const ksu = mockKsu()
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    await initBridge()
    runScript('test.sh', 'feature')
    expect(ksu.exec).toHaveBeenCalledWith(
      "sh '/data/adb/modules/Specter/features/test.sh'",
      '{}',
      expect.stringMatching(/^__sp_/)
    )
  })

  it('resolves with success on zero exit code', async () => {
    mockKsu({
      exec(_cmd, _opts, cbName) {
        const cb = (window as any)[cbName]
        cb(0, 'done', '')
      },
    })
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    await initBridge()
    const result = await runScript('ok.sh')
    expect(result).toEqual({ success: true, output: 'done', rawOutput: 'done' })
  })

  it('resolves with failure on non-zero exit code', async () => {
    mockKsu({
      exec(_cmd, _opts, cbName) {
        const cb = (window as any)[cbName]
        cb(1, 'fail output', 'stderr here')
      },
    })
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    await initBridge()
    const result = await runScript('fail.sh')
    expect(result.success).toBe(false)
    expect(result.output).toBe('fail output')
  })

  it('rejects on JSON script error', async () => {
    mockKsu({
      exec(_cmd, _opts, cbName) {
        const cb = (window as any)[cbName]
        cb(JSON.stringify({ success: false, stdout: 'error from script' }))
      },
    })
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    await initBridge()
    await expect(runScript('fail-json.sh')).rejects.toThrow('Script execution failed')
  })
})

describe('spawnScript', () => {
  it('emits error event when no bridge', async () => {
    vi.useRealTimers()
    delete (window as any).ksu
    const child = spawnScript('test.sh')
    const onError = vi.fn()
    child.on('error', onError)
    await vi.waitFor(() => expect(onError).toHaveBeenCalled())
  })

  it('emits stdout and exit events via exec fallback', async () => {
    vi.useRealTimers()
    mockKsu()
    // Don't provide spawn so spawnScript falls back to exec
    delete (window.ksu as any).spawn
    mockFetchJson({ MODDIR: '/data/adb/modules/Specter' })
    const ksu = window.ksu!
    ksu.exec = vi.fn((_cmd, _opts, cbName) => {
      const cb = (window as any)[cbName]
      cb(0, 'line1\nline2\n', '')
    }) as any
    await initBridge()
    const child = spawnScript('output.sh')
    const onData = vi.fn()
    const onExit = vi.fn()
    child.stdout.on('data', onData)
    child.on('exit', onExit)
    await new Promise(r => setTimeout(r, 10))
    expect(onData).toHaveBeenCalledTimes(2)
    expect(onExit).toHaveBeenCalledWith(0)
  })
})
