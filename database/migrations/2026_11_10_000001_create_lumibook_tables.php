<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('role', 16)->default('member')->index(); // admin (owner) | member
            $t->string('status', 16)->default('active');        // active | suspended
        });
        Schema::create('plans', function (Blueprint $t) {
            $t->id();
            $t->string('code')->unique();
            $t->string('name');
            $t->unsignedTinyInteger('tier')->default(0);
            $t->decimal('price', 10, 2)->nullable();             // set before launch
            $t->string('currency', 3)->default('PHP');
            $t->unsignedInteger('ebook_limit')->nullable();      // null = all eligible titles
            $t->unsignedInteger('download_limit')->nullable();   // null = unlimited (fair-use)
            $t->string('download_period', 10)->default('lifetime'); // lifetime | month
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
        Schema::create('titles', function (Blueprint $t) {
            $t->id();
            $t->string('slug')->unique();
            $t->string('title');
            $t->string('author');
            $t->text('description')->nullable();
            $t->string('category')->index();
            $t->string('private_file_key');                      // path on the private disk
            $t->string('rights_status', 16)->default('pending'); // pending | cleared | blocked
            $t->string('visibility', 16)->default('draft');      // draft | published
            $t->timestamps();
        });
        Schema::create('plan_titles', function (Blueprint $t) {
            $t->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $t->foreignId('title_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('sort_order')->default(0);
            $t->primary(['plan_id', 'title_id']);
        });
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained();
            $t->foreignId('plan_id')->constrained();
            $t->string('order_number')->unique();
            $t->decimal('amount', 10, 2)->default(0);
            $t->string('status', 16)->default('pending');        // pending | paid | failed | refunded
            $t->timestamp('paid_at')->nullable();
            $t->timestamps();
        });
        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained();
            $t->string('provider');                              // gateway name or "manual"
            $t->string('provider_reference')->nullable()->unique(); // idempotency key
            $t->string('status', 16)->default('pending');
            $t->timestamp('verified_at')->nullable();
            $t->timestamps();
        });
        Schema::create('entitlements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained();
            $t->foreignId('plan_id')->constrained();
            $t->foreignId('order_id')->nullable()->constrained();
            $t->foreignId('granted_by')->nullable()->constrained('users');
            $t->string('status', 16)->default('active');         // active | replaced | revoked
            $t->timestamp('starts_at')->useCurrent();
            $t->timestamp('ends_at')->nullable();
            $t->timestamps();
            $t->index(['user_id', 'status']);
        });
        Schema::create('download_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained();
            $t->foreignId('title_id')->constrained();
            $t->foreignId('entitlement_id')->nullable()->constrained();
            $t->uuid('request_id')->unique();
            $t->string('status', 16)->default('reserved');       // reserved | completed | failed
            $t->timestamp('completed_at')->nullable();
            $t->timestamps();
            $t->index(['user_id', 'status']);
        });
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('actor_user_id')->nullable()->constrained('users');
            $t->string('action')->index();
            $t->string('entity_type')->nullable();
            $t->unsignedBigInteger('entity_id')->nullable();
            $t->json('metadata')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['entity_type', 'entity_id']);
        });
    }
};
