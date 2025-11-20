-- Import des données exportées
-- Date d'export: 2025-11-20

-- Insertion de l'employé
INSERT INTO employees (id, first_name, last_name, address, vehicle_brand, vehicle_horsepower, created_at)
VALUES
  ('f218a9a3-a811-46f5-82f2-5b3d762661f1', 'Leda Jullyana', 'GOMES', '13 Rue Molitor 54000, Nancy', 'Golf6', 6, '2025-11-18T20:57:21.481705+00:00')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  address = EXCLUDED.address,
  vehicle_brand = EXCLUDED.vehicle_brand,
  vehicle_horsepower = EXCLUDED.vehicle_horsepower;

-- Insertion de l'avenant
INSERT INTO avenants (id, employee_id, period_start, period_end, description, created_at)
VALUES
  ('2038ca75-0b21-4cb4-ac64-74537ab1dd40', 'f218a9a3-a811-46f5-82f2-5b3d762661f1', '2024-01-01', '2025-08-31', 'Avenant N °1', '2025-11-18T20:59:51.521757+00:00')
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  period_start = EXCLUDED.period_start,
  period_end = EXCLUDED.period_end,
  description = EXCLUDED.description;

-- Insertion des déplacements
INSERT INTO travel_records (id, avenant_id, travel_date, day_of_week, route, total_km, created_at, is_punctual, monthly_occurrences, description)
VALUES
  ('bef15c92-c97b-4915-8df8-e32574940b12', '2038ca75-0b21-4cb4-ac64-74537ab1dd40', '2024-01-01', 'Lundi', '["Home","Amazone","Home","Selard cardio","SCM J.J","Home"]', 12.9, '2025-11-18T21:47:03.779989+00:00', false, 0, ''),
  ('112591c3-204e-4188-b3aa-868f3d31d96f', '2038ca75-0b21-4cb4-ac64-74537ab1dd40', '2024-01-02', 'Mardi', '["Home","SCM J.J","Home"]', 3.5, '2025-11-18T21:51:06.346106+00:00', false, 0, ''),
  ('17baace2-71c2-49ac-8553-2303482b5fec', '2038ca75-0b21-4cb4-ac64-74537ab1dd40', '2024-01-03', 'Mercredi', '["Home","SCP Graillot","Home"]', 14.6, '2025-11-18T21:52:36.210961+00:00', false, 0, ''),
  ('258acfd4-dd7c-4041-9e01-cb15b50c3423', '2038ca75-0b21-4cb4-ac64-74537ab1dd40', '2024-01-04', 'Jeudi', '["Home","SDC 42 A.F","Home"]', 6.8, '2025-11-18T21:56:03.651063+00:00', true, 2, 'Petit contrat'),
  ('7e052a0f-aefa-4660-b7ac-0ef84d4e4471', '2038ca75-0b21-4cb4-ac64-74537ab1dd40', '2024-01-05', 'Vendredi', '["Home","SCM J.J","Home"]', 3.5, '2025-11-18T21:57:21.873566+00:00', false, 0, '')
ON CONFLICT (id) DO UPDATE SET
  avenant_id = EXCLUDED.avenant_id,
  travel_date = EXCLUDED.travel_date,
  day_of_week = EXCLUDED.day_of_week,
  route = EXCLUDED.route,
  total_km = EXCLUDED.total_km,
  is_punctual = EXCLUDED.is_punctual,
  monthly_occurrences = EXCLUDED.monthly_occurrences,
  description = EXCLUDED.description;

-- Insertion des segments de route
INSERT INTO route_segments (id, travel_record_id, from_point, to_point, distance_km, sequence_order, created_at)
VALUES
  ('c3cc7125-f5ed-4cb8-9ad9-6f59e2cee3c5', '112591c3-204e-4188-b3aa-868f3d31d96f', 'Home', 'SCM J.J', 1.9, 0, '2025-11-18T21:51:06.582922+00:00'),
  ('a2dfe1f2-1d1d-48a0-b139-a3d7669502c4', 'bef15c92-c97b-4915-8df8-e32574940b12', 'Home', 'Amazone', 2.9, 0, '2025-11-18T21:47:03.951366+00:00'),
  ('a3538d5e-f7df-425a-ac43-8429d4db1b98', '17baace2-71c2-49ac-8553-2303482b5fec', 'Home', 'SCP Graillot', 7.3, 0, '2025-11-18T21:52:36.417304+00:00'),
  ('cca30825-230a-4f18-95b2-fa617b27c53d', '7e052a0f-aefa-4660-b7ac-0ef84d4e4471', 'Home', 'SCM J.J', 1.9, 0, '2025-11-18T21:57:21.962054+00:00'),
  ('69384ab8-7c35-4987-965a-1bccba0e2df5', '258acfd4-dd7c-4041-9e01-cb15b50c3423', 'Home', 'SDC 42 A.F', 3.4, 0, '2025-11-18T21:56:03.821786+00:00'),
  ('692a4c6c-3d9e-4914-a149-12ef86953949', '7e052a0f-aefa-4660-b7ac-0ef84d4e4471', 'SCM J.J', 'Home', 1.6, 1, '2025-11-18T21:57:21.962054+00:00'),
  ('4701b490-5042-41ee-98e2-8d74cb06075d', 'bef15c92-c97b-4915-8df8-e32574940b12', 'Amazone', 'Home', 2.9, 1, '2025-11-18T21:47:03.951366+00:00'),
  ('374c81df-dada-4941-bf47-f503fc28d192', '112591c3-204e-4188-b3aa-868f3d31d96f', 'SCM J.J', 'Home', 1.6, 1, '2025-11-18T21:51:06.582922+00:00'),
  ('3007555b-872a-4245-8269-f5ad58eb9148', '17baace2-71c2-49ac-8553-2303482b5fec', 'SCP Graillot', 'Home', 7.3, 1, '2025-11-18T21:52:36.417304+00:00'),
  ('a8e5d62a-e845-474b-8750-c3ab0a4bca30', '258acfd4-dd7c-4041-9e01-cb15b50c3423', 'SDC 42 A.F', 'Home', 3.4, 1, '2025-11-18T21:56:03.821786+00:00'),
  ('bd55c25f-b08a-4c57-9782-15b371002dfd', 'bef15c92-c97b-4915-8df8-e32574940b12', 'Home', 'Selard cardio', 2.2, 2, '2025-11-18T21:47:03.951366+00:00'),
  ('6a79f83c-0d58-46aa-a545-f1d91427c483', 'bef15c92-c97b-4915-8df8-e32574940b12', 'Selard cardio', 'SCM J.J', 3.3, 3, '2025-11-18T21:47:03.951366+00:00'),
  ('90667c8d-cca4-4c85-aacc-87da39c5c1fb', 'bef15c92-c97b-4915-8df8-e32574940b12', 'SCM J.J', 'Home', 1.6, 4, '2025-11-18T21:47:03.951366+00:00')
ON CONFLICT (id) DO UPDATE SET
  travel_record_id = EXCLUDED.travel_record_id,
  from_point = EXCLUDED.from_point,
  to_point = EXCLUDED.to_point,
  distance_km = EXCLUDED.distance_km,
  sequence_order = EXCLUDED.sequence_order;
