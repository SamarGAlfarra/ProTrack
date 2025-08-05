<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuthController extends Controller
{
    // ---------- LOGIN ----------
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if (!$user->is_approved) {
            return response()->json(['error' => 'Your account is pending approval.'], 403);
        }

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        return $this->sendTokenCookieResponse($token, auth('api')->user());
    }

    // ---------- CURRENT USER ----------
    public function me()
    {
        // يتم استخراج التوكن من الكوكي بواسطة الميدلوير AppendJwtFromCookie
        return response()->json(auth('api')->user());
    }

    // ---------- LOGOUT ----------
    public function logout()
    {
        // إلغاء التوكن على الخادم
        auth('api')->logout();

        // حذف الكوكي بنفس خصائصه لضمان الإزالة
        [$sameSite, $secure] = $this->cookieAttributes();

        $forgetCookie = cookie(
            name: 'token',
            value: '',
            minutes: -1,
            path: '/',
            domain: null,
            secure: $secure,
            httpOnly: true,
            raw: false,
            sameSite: $sameSite
        );

        return response()
            ->json(['message' => 'Successfully logged out'])
            ->withCookie($forgetCookie);
    }

    // ---------- REFRESH ----------
    public function refresh()
    {
        $newToken = auth('api')->refresh();
        return $this->sendTokenCookieResponse($newToken, auth('api')->user());
    }

    /**
     * يرسل الاستجابة ويثبت الـ JWT داخل كوكي HttpOnly بخصائص صحيحة حسب بيئة التشغيل
     */
    protected function sendTokenCookieResponse(string $token, $user)
    {
        $minutes = auth('api')->factory()->getTTL(); // TTL بالدقائق

        [$sameSite, $secure] = $this->cookieAttributes();

        $cookie = cookie(
            name:     'token',
            value:    $token,
            minutes:  $minutes,
            path:     '/',
            domain:   null,      // عدّلها في الإنتاج إذا كان لديك دومين محدد
            secure:   $secure,   // في الإنتاج يجب أن تكون true عند SameSite=None
            httpOnly: true,      // لا يمكن قراءته من JavaScript
            raw:      false,
            sameSite: $sameSite  // Lax (محلي) / None (إنتاج عبر نطاق مختلف)
        );

        return response()
            ->json([
                'message'    => 'OK',
                'expires_in' => $minutes * 60,
                'user'       => $user,
            ])
            ->withCookie($cookie);
    }

    /**
     * تحديد خصائص الكوكي حسب البيئة:
     * - local (مع Vite proxy => نفس الأصل): SameSite=Lax, Secure=false
     * - غير ذلك (إنتاج غالبًا نطاق مختلف + HTTPS): SameSite=None, Secure=true
     */
    protected function cookieAttributes(): array
    {
        $isLocal = app()->environment('local');

        if ($isLocal) {
            return ['Lax', false];
        }

        // إذا كنت تستخدم نفس الأصل أيضًا في الإنتاج يمكنك الإبقاء على Lax/true حسب HTTPS.
        // لكن عند الاختلاف بين الواجهه والخلفيه يجب None/true.
        return ['None', true];
    }

    // ---------- REGISTER ----------
    public function register(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string|max:255|unique:users,id',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:student,supervisor,admin',
            'department' => 'required|string',
            'phone_number' => 'required|string',
            'educational_degree' => 'nullable|string',
        ]);

        $user = User::create([
            'id' => $validated['id'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'department' => $validated['department'],
            'phone_number' => $validated['phone_number'],
            'is_approved' => false,
        ]);

        return response()->json([
            'message' => 'Registration request submitted. Awaiting admin approval.',
            'user' => $user,
        ], 201);
    }

    // ---------- SEND OTP ----------
    public function sendResetOTP(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Email not found.'], 404);
        }

        $otp = rand(100000, 999999);

        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $otp, 'created_at' => Carbon::now()]
        );

        Mail::raw("Your OTP code is: $otp", function ($message) use ($request) {
            $message->to($request->email)->subject('Password Reset Code - PROTRACK');
        });

        return response()->json(['message' => 'OTP has been sent to your email.']);
    }

    // ---------- VERIFY OTP ----------
    public function verifyResetOTP(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required'
        ]);

        $record = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('token', $request->otp)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid or incorrect OTP.'], 400);
        }

        if (Carbon::parse($record->created_at)->addMinutes(10)->isPast()) {
            return response()->json(['message' => 'OTP has expired.'], 410);
        }

        return response()->json(['message' => 'OTP verified successfully.']);
    }

    // ---------- RESET PASSWORD ----------
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:6|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
