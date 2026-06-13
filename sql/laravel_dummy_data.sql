-- Dummy database schema sesuai dengan aplikasi React web-kesehatan.
-- Tabel untuk: users (login), medical_records (data pasien & keluhan).
-- Import ke database `db_web` di Laragon MySQL.

USE `db_web`;

DROP TABLE IF EXISTS `medical_records`;
DROP TABLE IF EXISTS `user`;

-- Tabel Users: untuk login (username, password, role)
CREATE TABLE `user` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('Dokter','Pasien') NOT NULL DEFAULT 'Pasien',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel Medical Records: untuk data pasien dan keluhan
CREATE TABLE `medical_records` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) NOT NULL,
  `keluhan` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data dummy untuk users
INSERT INTO `user` (`username`,`password`,`role`) VALUES
('dr_ahmad','password123','Dokter'),
('pasien_budi','password123','Pasien');

-- Data dummy untuk medical records
INSERT INTO `medical_records` (`nama`,`keluhan`) VALUES
('Budi Santoso','Demam tinggi dan gejala flu'),
('Siti Aminah','Pemeriksaan rutin pasca operasi'),
('Fajar Pratama','Sakit kepala dan pusing berulang');
