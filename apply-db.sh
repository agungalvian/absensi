#!/bin/bash

# Pastikan file init.sql ada
if [ ! -f init.sql ]; then
    echo "Error: init.sql tidak ditemukan!"
    exit 1
fi

echo "Menerapkan skema database ke container absensi-db..."

# Menjalankan psql di dalam container
docker exec -i absensi-db psql -U postgres -d absensi < init.sql

if [ $? -eq 0 ]; then
    echo "------------------------------------------------"
    echo "BERHASIL: Skema database telah diterapkan."
    echo "------------------------------------------------"
else
    echo "------------------------------------------------"
    echo "GAGAL: Terjadi kesalahan saat menerapkan skema."
    echo "------------------------------------------------"
    exit 1
fi
