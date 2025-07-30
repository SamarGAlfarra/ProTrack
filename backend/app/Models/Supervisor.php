<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supervisor extends Model
{
    protected $primaryKey = 'supervisor_id';
    public $incrementing = false;
    public $timestamps = false;

    public function user()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'supervisor_id');
    }
}

