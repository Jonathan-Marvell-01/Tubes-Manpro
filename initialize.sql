-- WP 2.2: Matthew
-- Commit Message: feat(db): membuat skema database keseluruhan sistem, serta menambahkan data dummy
-- Commit to feature/database-init

-- Matikan cek foreign key sementara agar tidak error saat create/insert
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabel Asisten
CREATE TABLE IF NOT EXISTS Asisten (
  id_asisten INT AUTO_INCREMENT PRIMARY KEY,
  nama_asisten VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  alamat_asisten VARCHAR(200) NOT NULL,
  kontak_asisten VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

-- 2. Tabel Klien
CREATE TABLE IF NOT EXISTS Klien (
  id_klien INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  alamat VARCHAR(200) NOT NULL,
  kontak VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

-- 3. Tabel JenisEvent
CREATE TABLE IF NOT EXISTS JenisEvent (
  id_jenis INT AUTO_INCREMENT PRIMARY KEY,
  nama_jenis VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

-- 4. Tabel KategoriVendor
CREATE TABLE IF NOT EXISTS KategoriVendor (
  id_kategori INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT 1
);

-- 5. Tabel Event (Butuh JenisEvent)
CREATE TABLE IF NOT EXISTS Event (
  id_event INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  jumlah_undangan INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  id_jenis INT,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  CONSTRAINT FK_Event_JenisEvent FOREIGN KEY (id_jenis) REFERENCES JenisEvent(id_jenis)
);

-- 6. Tabel Vendor (Butuh KategoriVendor)
CREATE TABLE IF NOT EXISTS Vendor (
  id_vendor INT AUTO_INCREMENT PRIMARY KEY,
  nama_vendor VARCHAR(100) NOT NULL,
  nama_pemilik VARCHAR(100) NOT NULL,
  alamat VARCHAR(200) NOT NULL,
  kontak VARCHAR(20) NOT NULL UNIQUE,
  harga_min INT NOT NULL,
  harga_max INT NOT NULL,
  id_kategori INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  CONSTRAINT FK_Vendor_Kategori FOREIGN KEY (id_kategori) REFERENCES KategoriVendor(id_kategori)
);

-- 7. Tabel EventVendor (Penghubung Event & Vendor)
CREATE TABLE IF NOT EXISTS EventVendor (
  id_event INT NOT NULL,
  id_vendor INT NOT NULL,
  harga_dealing INT NULL,
  CONSTRAINT PK_EventVendor PRIMARY KEY (id_event, id_vendor),
  CONSTRAINT FK_EventVendor_Event FOREIGN KEY (id_event) REFERENCES Event(id_event) ON DELETE CASCADE,
  CONSTRAINT FK_EventVendor_Vendor FOREIGN KEY (id_vendor) REFERENCES Vendor(id_vendor) ON DELETE CASCADE
);

-- 8. Tabel MenyelenggarakanEvent (Penghubung Event, Klien, Asisten)
CREATE TABLE IF NOT EXISTS MenyelenggarakanEvent (
  id_event INT NOT NULL,
  id_klien INT NOT NULL,
  id_asisten INT NOT NULL,
  CONSTRAINT PK_MenyelenggarakanEvent PRIMARY KEY (id_event, id_klien, id_asisten),
  CONSTRAINT FK_ME_Event FOREIGN KEY (id_event) REFERENCES Event(id_event) ON DELETE CASCADE,
  CONSTRAINT FK_ME_Klien FOREIGN KEY (id_klien) REFERENCES Klien(id_klien) ON DELETE CASCADE,
  CONSTRAINT FK_ME_Asisten FOREIGN KEY (id_asisten) REFERENCES Asisten(id_asisten) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- DATA DUMMY (Hanya diinsert jika tabel kosong)
-- ---------------------------------------------------------

-- 1. Dummy Jenis Event
INSERT IGNORE INTO JenisEvent (id_jenis, nama_jenis) VALUES 
(1, 'Wedding'), 
(2, 'Birthday Party'), 
(3, 'Corporate Gathering'), 
(4, 'Music Concert'), 
(5, 'Exhibition'), 
(6, 'Seminar'), 
(7, 'Workshop'), 
(8, 'Charity Event'),
(9, 'Product Launch'),
(10, 'Reunion');

-- 2. Dummy Kategori Vendor
INSERT IGNORE INTO KategoriVendor (id_kategori, nama_kategori) VALUES 
(1, 'Catering'), 
(2, 'Decoration'), 
(3, 'Photography'), 
(4, 'Videography'), 
(5, 'Music/Band'), 
(6, 'Sound System'), 
(7, 'Venue'), 
(8, 'Makeup Artist'), 
(9, 'Florist'), 
(10, 'Souvenir');

-- 3. Dummy Asisten (Password semua: password123)
INSERT IGNORE INTO Asisten (nama_asisten, password, alamat_asisten, kontak_asisten) VALUES 
('Budi Santoso', 'password123', 'Jl. Mawar No 1, Jakarta', '081234567890'),
('Siti Aminah', 'password123', 'Jl. Melati No 2, Bandung', '081234567891'),
('Andi Pratama', 'password123', 'Jl. Kenanga No 3, Surabaya', '081234567892'),
('Dewi Lestari', 'password123', 'Jl. Anggrek No 4, Yogyakarta', '081234567893'),
('Rizky Hidayat', 'password123', 'Jl. Flamboyan No 5, Semarang', '081234567894'),
('Nurul Huda', 'password123', 'Jl. Dahlia No 6, Malang', '081234567895'),
('Eko Prasetyo', 'password123', 'Jl. Kamboja No 7, Solo', '081234567896'),
('Dian Sastro', 'password123', 'Jl. Tulip No 8, Bogor', '081234567897'),
('Agus Salim', 'password123', 'Jl. Teratai No 9, Depok', '081234567898'),
('Sri Wahyuni', 'password123', 'Jl. Sakura No 10, Tangerang', '081234567899');

-- 4. Dummy Klien
INSERT IGNORE INTO Klien (nama, alamat, kontak) VALUES 
('PT Maju Mundur', 'Jl. Sudirman No 5, Jakarta', '0215550001'),
('CV Sejahtera Abadi', 'Jl. Thamrin No 10, Jakarta', '0215550002'),
('Bapak Hartono', 'Jl. Kebon Jeruk No 15, Jakarta', '0811000001'),
('Ibu Megawati', 'Jl. Menteng No 20, Jakarta', '0811000002'),
('StartUp Unicorn', 'Jl. BSD Raya No 1, Tangerang', '0215550003'),
('Universitas Terbuka', 'Jl. Cabe Raya, Tangerang', '0215550004'),
('RS Sehat Selalu', 'Jl. Kesehatan No 8, Bandung', '0225550001'),
('Hotel Bintang Lima', 'Jl. Asia Afrika No 5, Bandung', '0225550002'),
('Komunitas Sepeda', 'Jl. Dago No 100, Bandung', '0811000003'),
('Yayasan Peduli Kasih', 'Jl. Riau No 50, Bandung', '0225550003'),
('PT Teknologi Masa Depan', 'Jl. Kaliurang km 5, Yogyakarta', '0274555001'),
('Warung Kopi Kenangan', 'Jl. Malioboro No 1, Yogyakarta', '0811000004'),
('Bapak Sultan', 'Jl. Keraton No 1, Yogyakarta', '0811000005'),
('CV Kreatif Visual', 'Jl. Gejayan No 10, Yogyakarta', '0274555002'),
('Toko Kue Lezat', 'Jl. Pemuda No 5, Semarang', '0245550001'),
('PT Garment Indonesia', 'Jl. Industri No 99, Semarang', '0245550002'),
('Ibu Kartini', 'Jl. Pahlawan No 21, Semarang', '0811000006'),
('Klub Mobil Sport', 'Jl. HR Muhammad, Surabaya', '0811000007'),
('PT Pelabuhan Mas', 'Jl. Perak No 1, Surabaya', '0315550001'),
('Restoran Rasa Nusantara', 'Jl. Tunjungan No 10, Surabaya', '0315550002');

-- 5. Dummy Vendor
INSERT IGNORE INTO Vendor (nama_vendor, nama_pemilik, alamat, kontak, harga_min, harga_max, id_kategori) VALUES 
('Sedap Catering', 'Bu Susi', 'Jl. Melati', '081999888001', 5000000, 20000000, 1),
('Mewah Decoration', 'Pak Tono', 'Jl. Mawar', '081999888002', 10000000, 50000000, 2),
('Fokus Photography', 'Mas Adi', 'Jl. Kenanga', '081999888003', 3000000, 15000000, 3),
('Cinema Wedding', 'Mas Bayu', 'Jl. Anggrek', '081999888004', 5000000, 25000000, 4),
('Harmoni Band', 'Rio', 'Jl. Flamboyan', '081999888005', 4000000, 12000000, 5),
('Glegar Sound', 'Pak Didik', 'Jl. Dahlia', '081999888006', 2000000, 10000000, 6),
('Gedung Serbaguna', 'Pak RT', 'Jl. Kamboja', '081999888007', 5000000, 15000000, 7),
('Cantik MUA', 'Mbak Tiara', 'Jl. Tulip', '081999888008', 1500000, 8000000, 8),
('Segar Florist', 'Bu Ani', 'Jl. Teratai', '081999888009', 500000, 5000000, 9),
('Unik Souvenir', 'Mbak Rina', 'Jl. Sakura', '081999888010', 1000000, 5000000, 10),
('Rasa Nusantara Catering', 'Bu Budi', 'Jl. Merdeka', '081999888011', 7000000, 30000000, 1),
('Elegan Decor', 'Pak Joko', 'Jl. Sudirman', '081999888012', 15000000, 70000000, 2),
('Jepret Photo', 'Mas Dwi', 'Jl. Thamrin', '081999888013', 2500000, 10000000, 3),
('Hotel Ballroom', 'Manager Hotel', 'Jl. Asia Afrika', '081999888014', 20000000, 100000000, 7),
('Rock Band', 'Roy', 'Jl. Dago', '081999888015', 5000000, 20000000, 5);

-- 6. Dummy Event (25 Event: Campuran Not Started, On Process, Finished)
INSERT IGNORE INTO Event (id_event, tanggal, jumlah_undangan, status, id_jenis) VALUES 
(1, '2023-10-01', 500, 'Finished', 1),
(2, '2023-10-05', 100, 'Finished', 2),
(3, '2023-10-10', 50, 'Finished', 3),
(4, '2023-10-15', 2000, 'Finished', 4),
(5, '2023-10-20', 1000, 'Finished', 5),
(6, '2023-11-01', 200, 'Finished', 6),
(7, '2023-11-05', 50, 'Finished', 7),
(8, '2023-11-10', 300, 'Finished', 8),
(9, '2023-11-15', 100, 'Finished', 9),
(10, '2023-11-20', 500, 'Finished', 10),
(11, '2023-12-01', 600, 'On Process', 1),
(12, '2023-12-05', 150, 'On Process', 2),
(13, '2023-12-10', 80, 'On Process', 3),
(14, '2023-12-15', 2500, 'On Process', 4),
(15, '2023-12-20', 1200, 'On Process', 5),
(16, '2024-01-01', 250, 'Not Started', 6),
(17, '2024-01-05', 60, 'Not Started', 7),
(18, '2024-01-10', 350, 'Not Started', 8),
(19, '2024-01-15', 120, 'Not Started', 9),
(20, '2024-01-20', 600, 'Not Started', 10),
(21, '2024-02-01', 700, 'Not Started', 1),
(22, '2024-02-14', 100, 'Not Started', 2),
(23, '2024-03-01', 100, 'Not Started', 3),
(24, '2024-03-15', 3000, 'Not Started', 4),
(25, '2024-04-01', 1500, 'Not Started', 5);

-- 7. Dummy MenyelenggarakanEvent (Menghubungkan Event dengan Klien & Asisten)
INSERT IGNORE INTO MenyelenggarakanEvent (id_event, id_klien, id_asisten) VALUES 
(1, 1, 1), (2, 2, 2), (3, 3, 3), (4, 4, 4), (5, 5, 5),
(6, 6, 6), (7, 7, 7), (8, 8, 8), (9, 9, 9), (10, 10, 10),
(11, 11, 1), (12, 12, 2), (13, 13, 3), (14, 14, 4), (15, 15, 5),
(16, 16, 6), (17, 17, 7), (18, 18, 8), (19, 19, 9), (20, 20, 10),
(21, 1, 2), (22, 3, 4), (23, 5, 6), (24, 7, 8), (25, 9, 10);

-- 8. Dummy EventVendor (Menghubungkan Event dengan Vendor & Harga Dealing)
-- Harga Dealing NULL artinya masih estimasi, ada isinya artinya Fix
INSERT IGNORE INTO EventVendor (id_event, id_vendor, harga_dealing) VALUES 
(1, 1, 15000000), (1, 2, 30000000), (1, 3, 10000000),
(2, 4, 20000000), (2, 5, 8000000),
(3, 6, 5000000),
(4, 7, 10000000), (4, 8, 5000000), (4, 15, 15000000),
(5, 9, 3000000), (5, 10, 4000000),
(11, 11, NULL), (11, 12, NULL), -- On Process (Masih Nego)
(12, 13, NULL),
(13, 14, NULL), (13, 6, NULL),
(21, 1, NULL), (21, 2, NULL), (21, 3, NULL); -- Not Started

-- Nyalakan kembali cek foreign key
SET FOREIGN_KEY_CHECKS = 1;