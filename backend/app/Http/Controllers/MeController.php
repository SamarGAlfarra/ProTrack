<?php
// app/Http/Controllers/MeController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MeController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'phone_number' => ['nullable','string','max:50'],
            // if you also send photo, just keep it here; it won’t affect phone-only requests.
            'photo' => ['nullable','image','mimes:jpg,jpeg,png,gif,webp','max:4096'],
        ]);

        if (array_key_exists('phone_number', $data)) {
            $user->phone_number = $data['phone_number'];
        }

        // (optional) handle photo here if you send it, not required for phone-only

        $user->save();

        // return the fresh value for instant UI update
        return response()->json([
            'ok' => true,
            'phone_number' => $user->phone_number,
            // optionally include other fields you show in the UI
        ]);
    }
}
