<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class DownloadEvent extends Model
{
    protected $guarded = [];
    protected $casts = ['completed_at' => 'datetime'];
    public function title() { return $this->belongsTo(Title::class); }
    public function user() { return $this->belongsTo(User::class); }
}
