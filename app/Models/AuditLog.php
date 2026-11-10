<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AuditLog extends Model
{
    public $timestamps = false;
    protected $guarded = [];
    protected $casts = ['metadata' => 'array', 'created_at' => 'datetime'];

    public static function record(string $action, ?Model $entity = null, array $meta = []): self
    {
        return static::create([
            'actor_user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => $entity ? class_basename($entity) : null,
            'entity_id' => $entity?->getKey(),
            'metadata' => $meta ?: null,
        ]);
    }
    public function actor() { return $this->belongsTo(User::class, 'actor_user_id'); }
}
