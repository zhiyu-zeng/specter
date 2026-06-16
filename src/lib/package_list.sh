# shellcheck shell=sh disable=SC2034
GMS_APPS="com.android.vending com.google.android.gsf com.google.android.gms com.google.android.contactkeys com.google.android.ims com.google.android.safetycore com.google.android.apps.walletnfcrel com.google.android.apps.nbu.paisa.user"
FIXED_TARGETS="android $GMS_APPS"

GMS_KILL_LIST="$GMS_APPS com.google.android.gms.persistent com.google.android.gms.unstable com.google.android.rkpdapp com.android.chrome com.google.android.googlequicksearchbox"

TOOL_APPS="bin.mt.plus bin.mt.plus.canary com.omarea.vtools moe.shizuku.privileged.api com.estrongs.android.pop com.coolapk.market com.sevtinge.hyperceiler com.coderstory.toolkit"
