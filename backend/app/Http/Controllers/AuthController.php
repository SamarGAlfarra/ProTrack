<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
    public function me(Request $request)
    {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            $user->photo_url = $user->photo ? asset('storage/'.$user->photo) : null;
            return response()->json($user);
    }

    // ---------- LOGOUT ----------
    public function logout()
    {
        auth('api')->logout();

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

    protected function sendTokenCookieResponse(string $token, $user)
    {
        $minutes = auth('api')->factory()->getTTL(); // TTL بالدقائق

        [$sameSite, $secure] = $this->cookieAttributes();

        $cookie = cookie(
            name:     'token',
            value:    $token,
            minutes:  $minutes,
            path:     '/',
            domain:   null,      
            secure:   $secure,  
            httpOnly: true,      
            raw:      false,
            sameSite: $sameSite  
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
    // app/Http/Controllers/AuthController.php
    public function resetPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|min:6|confirmed',
            'email'    => 'nullable|email', // now optional if user is logged in
        ]);

        // If logged in and email not provided, use the current user’s email
        $email = $request->email;
        if (!$email && $request->user()) {
            $email = $request->user()->email;
        }

        if (!$email) {
            return response()->json(['message' => 'Email is required.'], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // If you want to enforce OTP only for unauthenticated users, you can check here.
        // For the in-profile flow (authenticated), we skip OTP.

        $user->password = Hash::make($request->password);
        $user->save();

        // Clean any OTP rows
        DB::table('password_resets')->where('email', $email)->delete();

        // ✅ Send confirmation email
        Mail::raw(
            "Hello {$user->name},\n\nYour PROTRACK password was changed successfully. If this wasn’t you, contact support immediately.\n\nBest regards,\nPROTRACK Team",
            function ($message) use ($user) {
                $message->to($user->email)->subject('Your PROTRACK password was changed');
            }
        );

        return response()->json(['message' => 'Password updated successfully. A confirmation email was sent.']);
    }

}
