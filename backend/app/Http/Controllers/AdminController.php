<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\Supervisor;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AdminController extends Controller
{
    public function approveUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->is_approved) {
            return response()->json(['message' => 'User is already approved.'], 400);
        }

        $user->is_approved = true;
        $user->save();

        switch ($user->role) {
            case 'student':
                Student::create([
                    'id' => $user->id,
                    'department' => $user->department,
                    'phone_number' => $user->phone_number,
                ]);
                break;

            case 'supervisor':
                Supervisor::create([
                    'id' => $user->id,
                    'department' => $user->department,
                    'phone_number' => $user->phone_number,
                    'educational_degree' => 'Not specified'
                ]);
                break;

            case 'admin':
                Admin::create(['id' => $user->id]);
                break;
        }

        return response()->json(['message' => 'User approved successfully.']);
    }

    public function rejectUser($id)
    {
        $user = User::findOrFail($id);

        if ($user->is_approved) {
            return response()->json(['message' => 'Cannot reject an approved user.'], 400);
        }

        Mail::raw("Hello {$user->name},\n\nYour registration request on PROTRACK has been rejected by the administrator.\n\nIf you have questions, please contact support.", function ($message) use ($user) {
            $message->to($user->email)->subject('PROTRACK Registration Rejected');
        });

        $user->delete();

        return response()->json(['message' => 'User has been rejected and removed.']);
    }

    public function listPendingUsers()
    {
        $pending = User::where('is_approved', false)->get();
        return response()->json($pending);
    }
}
