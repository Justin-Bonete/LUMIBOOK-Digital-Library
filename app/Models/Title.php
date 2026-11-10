<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Title extends Model
{
    protected $guarded = [];
    protected $hidden = ['private_file_key']; // never expose the storage path
    public function plans() { return $this->belongsToMany(Plan::class, 'plan_titles'); }
}
