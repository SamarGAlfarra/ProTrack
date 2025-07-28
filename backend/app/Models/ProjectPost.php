<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use LaravelTreats\Model\Traits\HasCompositePrimaryKey;

class ProjectPost extends Model
{
    use HasCompositePrimaryKey;

    protected $table = 'project_posts';
    protected $primaryKey = ['project_id', 'author_id', 'timestamp'];
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['project_id', 'author_id', 'timestamp', 'content'];

    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}

