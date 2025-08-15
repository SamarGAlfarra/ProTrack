<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Department;
use Illuminate\Support\Facades\Storage; 

class User extends Authenticatable implements JWTSubject
{
    use Notifiable;

    public $incrementing = false;
    protected $primaryKey = 'id';
    protected $keyType = 'string'; 
    public $timestamps = false;
public function dept()
{
    return $this->belongsTo(Department::class, 'department', 'id');
}
    protected $fillable = [
        'id', 'name', 'email', 'password', 'role',
        'photo', 'is_approved', 'department', 'phone_number'
    ];

    protected $casts = [
    'is_approved' => 'boolean',
    ];

    protected $appends = ['photo_url'];

    public function getPhotoUrlAttribute()
    {
        return $this->photo ? Storage::disk('public')->url($this->photo) : null;
    }

    // JWT-required methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    // Relationships
    public function department()
    {
        return $this->belongsTo(Department::class, 'department');
    }

    public function student()
    {
        return $this->hasOne(Student::class, 'student_id');
    }

    public function supervisor()
    {
        return $this->hasOne(Supervisor::class, 'supervisor_id');
    }

    public function admin()
    {
        return $this->hasOne(Admin::class, 'admin_id');
    }

    public function userposts()
    {
        return $this->hasOne(ProjectPost::class, 'author_id');
    }

    public function usercomments()
    {
        return $this->hasOne(Comment::class, 'author_id');
    }
}

