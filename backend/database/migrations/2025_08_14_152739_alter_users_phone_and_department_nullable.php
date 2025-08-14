<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            // If column exists as BIGINT, convert to string
            $table->string('phone_number', 32)->nullable()->change();

            // If you want admins to be able to omit department too, make it nullable:
            $table->unsignedBigInteger('department')->nullable()->change();
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            // Rollback (adjust to your old types if different)
            $table->bigInteger('phone_number')->nullable(false)->change();
            $table->unsignedBigInteger('department')->nullable(false)->change();
            $table->dropForeign(['department']);
            $table->foreign('department')
            ->references('id')->on('departments')
            ->nullOnDelete();
        });
    }
};

