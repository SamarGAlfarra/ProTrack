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

        if (! $token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        return $this->respondWithToken($token);
    }

    public function me()
    {
        return response()->json(auth('api')->user());
    }

    public function logout()
    {
        auth('api')->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh()
    {
        return $this->respondWithToken(auth('api')->refresh());
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => auth('api')->user()
        ]);
    }

    // ---------- REGISTER ----------
    public function register(Request $request)
    {
        $validated = $request->validate([
        'id' => 'required|string|max:255|unique:users,id', // ✅ Add this
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:6',
        'role' => 'required|in:student,supervisor,admin',
        'department' => 'required|string',
        'phone_number' => 'required|string',
        'educational_degree' => 'nullable|string',
        ]);

        $user = User::create([
        'id' => $validated['id'], // ✅ Store it
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
        $request->validate([
            'email' => 'required|email'
        ]);

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







