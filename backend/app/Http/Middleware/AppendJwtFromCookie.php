<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AppendJwtFromCookie
{
    // app/Http/Middleware/AppendJwtFromCookie.php
    public function handle($request, Closure $next)
    {
        $token = $request->cookie('token');
        if ($token && !$request->bearerToken()) {
            $request->headers->set('Authorization', 'Bearer '.$token);
        }
        return $next($request);
    }

}
