<?php
namespace Database\Seeders;

use App\Models\{Entitlement, Plan, Title, User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LumibookSeeder extends Seeder
{
    public function run(): void
    {
        // Limits from the LUMIBOOK documentation (Free values are "proposed"; prices left null until decided).
        $plans = [
            ['free', 'Free', 0, 5, 3, 'month'],
            ['premium', 'Premium', 1, 20, 10, 'lifetime'],
            ['plus', 'Premium Plus', 2, 58, 30, 'lifetime'],
            ['all', 'All Access', 3, null, null, 'lifetime'],
        ];
        foreach ($plans as [$code, $name, $tier, $ebooks, $dl, $per]) {
            Plan::updateOrCreate(['code' => $code], ['name' => $name, 'tier' => $tier,
                'ebook_limit' => $ebooks, 'download_limit' => $dl, 'download_period' => $per]);
        }

        // Owner/admin: set ADMIN_EMAIL / ADMIN_PASSWORD in .env. Change the default immediately.
        User::updateOrCreate(['email' => env('ADMIN_EMAIL', 'owner@lumibook.test')], [
            'name' => 'Owner', 'password' => env('ADMIN_PASSWORD', 'ChangeMe!2026'),
            'role' => 'admin', 'status' => 'active', 'email_verified_at' => now()]);

        if (! app()->environment('local')) return;

        // Local demo data: 12 sample titles, curated per plan (first 5 free, 8 premium, all 12 plus).
        $cats = ['Study Skills', 'Languages', 'Science', 'Technology', 'Mathematics', 'Business'];
        foreach (range(1, 12) as $i) {
            $t = Title::firstOrCreate(['slug' => "sample-title-$i"], [
                'title' => "Sample Title $i", 'author' => 'Sample Author', 'category' => $cats[$i % 6],
                'private_file_key' => "pdfs/sample-$i.pdf", 'rights_status' => 'cleared', 'visibility' => 'published']);
            foreach (['free' => 5, 'premium' => 8, 'plus' => 12] as $code => $n) {
                if ($i <= $n) Plan::where('code', $code)->first()->titles()->syncWithoutDetaching([$t->id => ['sort_order' => $i]]);
            }
        }
        foreach (['free', 'premium', 'plus', 'all'] as $code) {
            $u = User::updateOrCreate(['email' => "$code@lumibook.test"], ['name' => ucfirst($code) . ' Member',
                'password' => 'password', 'role' => 'member', 'status' => 'active', 'email_verified_at' => now()]);
            if ($code !== 'free') {
                Entitlement::firstOrCreate(['user_id' => $u->id, 'status' => 'active'], ['plan_id' => Plan::where('code', $code)->value('id')]);
            }
        }
    }
}
