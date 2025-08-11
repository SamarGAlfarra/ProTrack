<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supervisor extends Model
{
    protected $primaryKey = 'supervisor_id';
    public $incrementing = false;
    public $timestamps = false;

    // Add all columns you actually save here:
    protected $fillable = ['supervisor_id', 'educational_degree', 'projects_no_limit'/*, 'department', 'phone_number'*/];

    // ✅ Eloquent-level default so inserts always include it
    protected $attributes = [
        'projects_no_limit' => 5, // or whatever default you want
    ];

    public function user()   { return $this->belongsTo(User::class, 'supervisor_id'); }
    public function projects(){ return $this->hasMany(Project::class, 'supervisor_id', 'supervisor_id'); }
}
