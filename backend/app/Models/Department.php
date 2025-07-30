<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    public $incrementing = true;
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = ['id','name'];

    public function users()
    {
        return $this->hasMany(User::class, 'department');
    }
}

