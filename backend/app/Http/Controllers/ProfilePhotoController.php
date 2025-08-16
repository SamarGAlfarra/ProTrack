<?php
// app/Http/Controllers/ProfilePhotoController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfilePhotoController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        // validate the uploaded image
        $data = $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:4096'],
        ]);

        // delete old photo if it exists
        if ($user->photo && Storage::disk('public')->exists($user->photo)) {
            Storage::disk('public')->delete($user->photo);
        }

        // store new photo under /storage/avatars/{user_id}/...
        $path = $request->file('photo')->store("avatars/{$user->id}", 'public');

        // persist DB path (relative to the 'public' disk root)
        $user->photo = $path;
        $user->save();

        // return a URL the frontend can use directly
        return response()->json([
            'ok' => true,
            'photo_url' => asset(\Illuminate\Support\Facades\Storage::url($path)), // => /storage/avatars/...
        ]);
    }
}
