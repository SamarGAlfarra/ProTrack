<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Supervisor;

class ProfileController extends Controller
{
    // جلب بروفايل المستخدم الحالي
    public function show(Request $request)
    {
        $user = $request->user()->load(['dept:id,name,Name']);

        $departmentName = optional($user->dept)->name
            ?? optional($user->dept)->Name
            ?? (string) $user->department;

        return response()->json([
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'department_id'  => $user->department,
            'department'     => $departmentName,
            'phone_number'   => $user->phone_number,
            'photo'          => $user->photo,
            'photo_url'      => $user->photo ? asset('storage/'.$user->photo) : null,
        ]);
    }

    // تحديث بيانات البروفايل (بدون تغيير الـ id)
    public function update(Request $request)
    {
        $user = $request->user();

        $rules = [
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|max:255|unique:users,email,'.$user->id.',id',
            'phone_number' => 'nullable|string|max:30',
            'department'   => 'nullable|integer|exists:departments,id',
        ];

        if ($user->role === 'supervisor') {
            $rules['educational_degree'] = 'nullable|string|max:255';
            $rules['projects_no_limit']  = 'nullable|integer|min:1|max:50';
        }

        $data = $request->validate($rules);

        $user->fill([
            'name'         => $data['name'],
            'email'        => $data['email'],
            'phone_number' => $data['phone_number'] ?? $user->phone_number,
            'department'   => $data['department']   ?? $user->department,
        ])->save();

        if ($user->role === 'supervisor') {
            $sup = Supervisor::firstOrCreate(['supervisor_id' => $user->id]);
            $sup->fill([
                'educational_degree' => $data['educational_degree'] ?? $sup->educational_degree,
                'projects_no_limit'  => $data['projects_no_limit']  ?? $sup->projects_no_limit,
            ])->save();
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
        ]);
    }

    // رفع صورة البروفايل
    public function uploadPhoto(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        if ($user->photo && Storage::disk('public')->exists($user->photo)) {
            Storage::disk('public')->delete($user->photo);
        }

        $path = $request->file('photo')->store("avatars/{$user->id}", 'public');

        $user->photo = $path;
        $user->save();

        return response()->json([
            'message'   => 'Photo uploaded successfully.',
            'photo'     => $user->photo,
            'photo_url' => asset('storage/'.$user->photo),
        ]);
    }
}
