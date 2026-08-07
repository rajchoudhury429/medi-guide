
DELETE FROM public.facilities;

INSERT INTO public.facilities (name, kind, address, city, phone, rating, latitude, longitude, open_24h, opens_at, closes_at) VALUES
('All India Institute of Medical Sciences (AIIMS)','hospital','Ansari Nagar East','New Delhi','+91 11 2658 8500',4.7,28.5672,77.2100,true,NULL,NULL),
('Safdarjung Hospital','hospital','Ansari Nagar West','New Delhi','+91 11 2673 0000',4.2,28.5679,77.2064,true,NULL,NULL),
('Max Super Speciality Hospital Saket','hospital','Press Enclave Road, Saket','New Delhi','+91 11 2651 5050',4.5,28.5275,77.2145,true,NULL,NULL),
('Apollo Clinic Lajpat Nagar','clinic','Ring Road, Lajpat Nagar','New Delhi','+91 11 4141 4141',4.3,28.5677,77.2433,false,'08:00','21:00'),
('Apollo Pharmacy Connaught Place','pharmacy','Block N, Connaught Place','New Delhi','+91 11 2341 2000',4.4,28.6330,77.2196,false,'08:00','23:00'),
('Lilavati Hospital','hospital','A-791, Bandra Reclamation','Mumbai','+91 22 2675 1000',4.6,19.0509,72.8296,true,NULL,NULL),
('Kokilaben Dhirubhai Ambani Hospital','hospital','Rao Saheb Achutrao Patwardhan Marg, Andheri West','Mumbai','+91 22 3096 6767',4.6,19.1307,72.8256,true,NULL,NULL),
('Wellness Forever Pharmacy Dadar','pharmacy','Ranade Road, Dadar West','Mumbai','+91 22 6236 5555',4.3,19.0212,72.8424,false,'07:00','23:30'),
('Manipal Hospital Old Airport Road','hospital','98, HAL Old Airport Road','Bengaluru','+91 80 2502 4444',4.5,12.9591,77.6492,true,NULL,NULL),
('Narayana Health City','hospital','258/A Bommasandra','Bengaluru','+91 80 7122 2222',4.5,12.8005,77.6900,true,NULL,NULL),
('Cloudnine Clinic Jayanagar','clinic','1533, 9th Main, Jayanagar','Bengaluru','+91 99728 99728',4.4,12.9250,77.5938,false,'09:00','20:00'),
('MedPlus Pharmacy Indiranagar','pharmacy','100 Feet Road, Indiranagar','Bengaluru','+91 80 4123 4567',4.2,12.9719,77.6412,false,'08:00','22:30'),
('Apollo Hospitals Greams Road','hospital','21, Greams Lane, Off Greams Road','Chennai','+91 44 2829 3333',4.6,13.0633,80.2510,true,NULL,NULL),
('Fortis Malar Hospital','hospital','52, 1st Main Road, Gandhi Nagar, Adyar','Chennai','+91 44 4289 2222',4.3,13.0067,80.2570,true,NULL,NULL),
('Yashoda Hospitals Somajiguda','hospital','Raj Bhavan Road, Somajiguda','Hyderabad','+91 40 4567 4567',4.5,17.4239,78.4600,true,NULL,NULL),
('Care Clinic Gachibowli','clinic','Gachibowli Main Road','Hyderabad','+91 40 6810 6589',4.2,17.4401,78.3489,false,'09:00','21:00'),
('AMRI Hospital Dhakuria','hospital','JC-16 & 17, Dhakuria','Kolkata','+91 33 6606 3800',4.3,22.5116,88.3651,true,NULL,NULL),
('Frank Ross Pharmacy Park Street','pharmacy','Park Street','Kolkata','+91 33 4040 4040',4.1,22.5530,88.3520,false,'08:30','22:00'),
('Ruby Hall Clinic','hospital','40, Sassoon Road','Pune','+91 20 6645 5100',4.4,18.5314,73.8779,true,NULL,NULL),
('Sahyadri Clinic Kothrud','clinic','Karve Road, Kothrud','Pune','+91 20 6721 3000',4.2,18.5074,73.8077,false,'09:00','20:30');

DELETE FROM public.doctors WHERE id NOT IN (SELECT doctor_id FROM public.appointments WHERE doctor_id IS NOT NULL);

INSERT INTO public.doctors (name, specialty, qualification, experience_years, rating, clinic_name, clinic_address, city, consultation_fee, bio, phone) VALUES
('Dr. Arvind Menon','Cardiologist','MBBS, MD, DM (Cardiology)',18,4.8,'Max Super Speciality Hospital Saket','Press Enclave Road, Saket','New Delhi',1200,'Interventional cardiologist specialising in angioplasty and heart failure care.','+91 11 2651 5050'),
('Dr. Priya Sharma','Dermatologist','MBBS, MD (Dermatology)',11,4.7,'Apollo Clinic Lajpat Nagar','Ring Road, Lajpat Nagar','New Delhi',800,'Treats acne, pigmentation and hair loss with evidence-based protocols.','+91 11 4141 4141'),
('Dr. Rajesh Iyer','Neurologist','MBBS, MD, DM (Neurology)',20,4.7,'Lilavati Hospital','Bandra Reclamation','Mumbai',1500,'Focus on epilepsy, stroke rehabilitation and movement disorders.','+91 22 2675 1000'),
('Dr. Sneha Deshmukh','Pediatrician','MBBS, MD (Paediatrics)',13,4.9,'Kokilaben Dhirubhai Ambani Hospital','Andheri West','Mumbai',900,'Newborn care, childhood vaccination and growth monitoring.','+91 22 3096 6767'),
('Dr. Karthik Rao','Orthopedic','MBBS, MS (Orthopaedics)',15,4.6,'Manipal Hospital Old Airport Road','HAL Old Airport Road','Bengaluru',1000,'Knee and shoulder arthroscopy, sports injuries and joint replacement.','+91 80 2502 4444'),
('Dr. Ananya Nair','ENT','MBBS, MS (ENT)',9,4.5,'Cloudnine Clinic Jayanagar','9th Main, Jayanagar','Bengaluru',700,'Sinus care, hearing evaluation and paediatric ENT procedures.','+91 99728 99728'),
('Dr. Vikram Subramanian','Cardiologist','MBBS, MD, DNB (Cardiology)',16,4.6,'Apollo Hospitals Greams Road','Greams Lane','Chennai',1100,'Preventive cardiology, hypertension and cholesterol management.','+91 44 2829 3333'),
('Dr. Meera Krishnan','Dentist','BDS, MDS (Prosthodontics)',10,4.6,'Fortis Malar Hospital','Gandhi Nagar, Adyar','Chennai',600,'Root canal treatment, crowns and smile design.','+91 44 4289 2222'),
('Dr. Sameer Reddy','Neurologist','MBBS, MD, DM (Neurology)',12,4.5,'Yashoda Hospitals Somajiguda','Raj Bhavan Road','Hyderabad',1000,'Migraine, neuropathy and sleep disorder management.','+91 40 4567 4567'),
('Dr. Ritu Banerjee','Pediatrician','MBBS, DCH, MD (Paediatrics)',14,4.7,'AMRI Hospital Dhakuria','Dhakuria','Kolkata',700,'Child nutrition, allergies and adolescent health.','+91 33 6606 3800'),
('Dr. Aditya Kulkarni','Orthopedic','MBBS, MS, Fellowship in Spine',17,4.6,'Ruby Hall Clinic','Sassoon Road','Pune',950,'Spine surgery, fracture care and physiotherapy planning.','+91 20 6645 5100'),
('Dr. Nisha Patel','Dentist','BDS, MDS (Orthodontics)',8,4.5,'Sahyadri Clinic Kothrud','Karve Road, Kothrud','Pune',550,'Braces, aligners and preventive dental care for all ages.','+91 20 6721 3000');
