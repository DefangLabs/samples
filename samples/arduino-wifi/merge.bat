esptool.py --chip esp32s3 \
merge_bin -o sensecap_indicator_basis_v1.0.0.bin \
--flash_mode dio \
--flash_size 8MB \
0x0 ../../build/bootloader/bootloader.bin \
0x8000 ../../build/partition_table/partition-table.bin \
0x10000 ../../build/indicator_basis.bin