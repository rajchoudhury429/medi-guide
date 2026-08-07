
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  age INT,
  blood_group TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  allergies TEXT,
  chronic_conditions TEXT,
  phone TEXT,
  theme TEXT NOT NULL DEFAULT 'light',
  language TEXT NOT NULL DEFAULT 'en',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  share_location BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.emergency_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  file_path TEXT,
  file_name TEXT,
  record_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_records TO authenticated;
GRANT ALL ON public.health_records TO service_role;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own records" ON public.health_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.medicine_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  times TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicine_reminders TO authenticated;
GRANT ALL ON public.medicine_reminders TO service_role;
ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reminders" ON public.medicine_reminders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  reminder_id UUID NOT NULL REFERENCES public.medicine_reminders ON DELETE CASCADE,
  scheduled_time TEXT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'taken'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_logs TO authenticated;
GRANT ALL ON public.reminder_logs TO service_role;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs" ON public.reminder_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  qualification TEXT,
  experience_years INT NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 4.5,
  clinic_name TEXT,
  clinic_address TEXT,
  city TEXT,
  consultation_fee INT,
  bio TEXT,
  phone TEXT,
  avatar_url TEXT
);
GRANT SELECT ON public.doctors TO anon, authenticated;
GRANT ALL ON public.doctors TO service_role;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctors public read" ON public.doctors FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT,
  uses TEXT NOT NULL,
  dosage_guidance TEXT,
  side_effects TEXT,
  warnings TEXT,
  age_restrictions TEXT,
  pregnancy_warning TEXT,
  interactions TEXT,
  prescription_required BOOLEAN NOT NULL DEFAULT false
);
GRANT SELECT ON public.medicines TO anon, authenticated;
GRANT ALL ON public.medicines TO service_role;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medicines public read" ON public.medicines FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'hospital',
  address TEXT,
  city TEXT,
  phone TEXT,
  rating NUMERIC NOT NULL DEFAULT 4.2,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  open_24h BOOLEAN NOT NULL DEFAULT false,
  opens_at TEXT DEFAULT '08:00',
  closes_at TEXT DEFAULT '22:00'
);
GRANT SELECT ON public.facilities TO anon, authenticated;
GRANT ALL ON public.facilities TO service_role;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facilities public read" ON public.facilities FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors ON DELETE SET NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own appointments" ON public.appointments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.symptom_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_checks TO authenticated;
GRANT ALL ON public.symptom_checks TO service_role;
ALTER TABLE public.symptom_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checks" ON public.symptom_checks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.medicines (name, generic_name, category, uses, dosage_guidance, side_effects, warnings, age_restrictions, pregnancy_warning, interactions, prescription_required) VALUES
('Paracetamol','Acetaminophen','Analgesic / Antipyretic','Relief of mild to moderate pain such as headache, toothache and body ache, and reduction of fever.','Adults: typically 500–1000 mg every 4–6 hours as stated on the product label. Do not exceed 4000 mg in 24 hours.','Rare at normal doses. Nausea, rash. Liver damage with overdose.','Never combine with other products containing paracetamol. Avoid with heavy alcohol use.','Not for children under 2 months without medical advice; use paediatric label dosing.','Generally considered acceptable at the lowest effective dose; consult your doctor.','Warfarin (monitor INR), other paracetamol-containing products.',false),
('Ibuprofen','Ibuprofen','NSAID','Pain, inflammation, fever, menstrual cramps, muscle sprains.','Adults: 200–400 mg every 4–6 hours with food per the product label. Maximum as stated on the pack.','Stomach upset, heartburn, dizziness, increased blood pressure.','Avoid with stomach ulcers, kidney disease or heart failure. Take with food.','Not recommended under 6 months.','Avoid, especially after 20 weeks of pregnancy.','Blood thinners, aspirin, other NSAIDs, some blood pressure medicines.',false),
('Cetirizine','Cetirizine hydrochloride','Antihistamine','Allergy symptoms: sneezing, runny nose, itchy eyes, hives.','Adults: 10 mg once daily as per label.','Drowsiness, dry mouth, fatigue.','May impair driving. Reduce dose in kidney impairment.','Paediatric dosing from 2 years; follow the label.','Discuss with your doctor before use.','Alcohol and other sedatives increase drowsiness.',false),
('Omeprazole','Omeprazole','Proton pump inhibitor','Heartburn, acid reflux and stomach ulcer protection.','Adults: 20 mg once daily before food, per the product label. Short-term OTC use only.','Headache, abdominal pain, diarrhoea, nausea.','Long-term use may affect vitamin B12 and magnesium levels.','Not for children without medical advice.','Consult your doctor before use.','Clopidogrel, methotrexate, some antifungals.',false),
('Oral Rehydration Salts','ORS','Electrolyte replacement','Prevents and treats dehydration from diarrhoea or vomiting.','Dissolve one sachet in the volume of clean water stated on the sachet and sip frequently.','Vomiting if drunk too quickly.','Seek urgent care for signs of severe dehydration.','Safe for all ages with correct dilution.','Safe.','None significant.',false),
('Amoxicillin','Amoxicillin','Antibiotic','Bacterial infections of the chest, ear, throat, urinary tract and skin.','Prescription only. Take exactly as prescribed and finish the full course.','Diarrhoea, nausea, rash.','Do not use for viral infections such as colds or flu.','Weight-based dosing in children.','Usually considered safe; prescriber decides.','Oral contraceptives, methotrexate, allopurinol.',true),
('Salbutamol Inhaler','Albuterol','Bronchodilator','Relief of asthma symptoms and wheezing.','Usually 1–2 puffs when needed, as directed by your prescriber.','Tremor, fast heartbeat, headache.','Seek emergency care if the inhaler no longer relieves symptoms.','Paediatric use under medical supervision.','Generally continued in pregnancy under supervision.','Beta blockers may reduce its effect.',true),
('Loperamide','Loperamide','Antidiarrhoeal','Short-term control of sudden diarrhoea.','Follow the pack: usually an initial dose then one after each loose stool, within the daily maximum.','Constipation, dizziness, abdominal cramps.','Do not use with bloody stools or high fever. Never exceed the labelled dose.','Not for children under 12 without medical advice.','Avoid unless advised by your doctor.','Some heart rhythm medicines.',false);

INSERT INTO public.doctors (name, specialty, qualification, experience_years, rating, clinic_name, clinic_address, city, consultation_fee, bio, phone) VALUES
('Dr. Anika Rahman','Cardiologist','MBBS, MD (Cardiology)',14,4.8,'HeartCare Institute','12 Lake View Road','Dhaka',1200,'Specialist in preventive cardiology, hypertension and heart failure management.','+8801711000001'),
('Dr. Imran Chowdhury','Neurologist','MBBS, FCPS (Neurology)',11,4.6,'NeuroLife Clinic','5 Green Avenue','Dhaka',1500,'Focus on migraine, epilepsy and stroke rehabilitation.','+8801711000002'),
('Dr. Sadia Karim','Dermatologist','MBBS, DDV',9,4.7,'Skin & Glow Centre','88 Rose Street','Chattogram',900,'Treats acne, eczema, pigmentation and hair loss.','+8801711000003'),
('Dr. Rifat Hasan','Dentist','BDS, MS (Ortho)',8,4.5,'BrightSmile Dental','21 Market Lane','Dhaka',700,'Orthodontics, root canal therapy and cosmetic dentistry.','+8801711000004'),
('Dr. Nusrat Jahan','Pediatrician','MBBS, DCH',12,4.9,'Little Steps Child Care','7 Garden Road','Sylhet',800,'Newborn care, vaccination schedules and childhood nutrition.','+8801711000005'),
('Dr. Tanvir Alam','Orthopedic','MBBS, MS (Ortho)',15,4.6,'BoneCare Ortho Hospital','40 Station Road','Dhaka',1100,'Joint replacement, sports injuries and spine care.','+8801711000006'),
('Dr. Farhana Islam','ENT','MBBS, FCPS (ENT)',10,4.4,'Hearing & Sinus Clinic','3 Hill View','Khulna',850,'Sinusitis, hearing loss, tonsils and vertigo management.','+8801711000007'),
('Dr. Mahmud Kabir','Cardiologist','MBBS, MRCP',18,4.9,'City Heart Centre','99 Central Avenue','Chattogram',1600,'Interventional cardiology and post-surgery follow-up.','+8801711000008'),
('Dr. Sabrina Noor','Dermatologist','MBBS, MD (Derm)',6,4.3,'DermaPlus','14 Park Street','Dhaka',950,'Laser therapy, allergy-related skin conditions.','+8801711000009'),
('Dr. Jamal Uddin','Pediatrician','MBBS, FCPS (Paed)',20,4.8,'Sunshine Children Hospital','60 River Road','Dhaka',1000,'Paediatric asthma and developmental care.','+8801711000010');

INSERT INTO public.facilities (name, kind, address, city, phone, rating, latitude, longitude, open_24h, opens_at, closes_at) VALUES
('City General Hospital','hospital','120 Central Avenue','Dhaka','+8801811000001',4.5,23.7808,90.4074,true,NULL,NULL),
('Green Valley Medical Centre','hospital','45 Green Road','Dhaka','+8801811000002',4.2,23.7515,90.3890,true,NULL,NULL),
('Sunrise Clinic','clinic','9 Lake Circus','Dhaka','+8801811000003',4.0,23.7461,90.3742,false,'09:00','21:00'),
('CareFirst Family Clinic','clinic','77 Mirpur Road','Dhaka','+8801811000004',4.3,23.7644,90.3654,false,'08:00','20:00'),
('MediPlus Pharmacy','pharmacy','15 Market Street','Dhaka','+8801811000005',4.6,23.7789,90.4001,true,NULL,NULL),
('HealthMart Pharmacy','pharmacy','2 Station Road','Dhaka','+8801811000006',4.1,23.7330,90.4120,false,'08:00','23:00'),
('Riverside Hospital','hospital','88 River View','Chattogram','+8801811000007',4.4,22.3569,91.7832,true,NULL,NULL),
('Hilltop Clinic','clinic','31 Hill Road','Sylhet','+8801811000008',3.9,24.8949,91.8687,false,'10:00','18:00'),
('QuickCare Pharmacy','pharmacy','5 Bazar Lane','Khulna','+8801811000009',4.2,22.8456,89.5403,false,'09:00','22:00'),
('Metro Emergency Hospital','hospital','300 Metro Highway','Dhaka','+8801811000010',4.7,23.8103,90.4125,true,NULL,NULL);
