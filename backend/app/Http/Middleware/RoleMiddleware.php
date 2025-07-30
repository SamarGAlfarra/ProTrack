<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  $role  The required role (passed from the route)
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = Auth::user();

        // If not authenticated
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // If role doesn't match
        if ($user->role !== $role) {
            return response()->json(['message' => 'Forbidden - Insufficient permissions'], 403);
        }

        return $next($request);
    }
}

