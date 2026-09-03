-- CHOCO FOOD APP LAB ONLY
-- Run only against the existing choco_food_lab_* tables.
-- Never targets production orders/menu tables.
insert into public.choco_food_lab_categories (id,name,slug,image_url,sort_order) values
('11111111-1111-4111-8111-111111111101','Cơm','com','🍚',1),
('11111111-1111-4111-8111-111111111102','Bún','bun','🍜',2),
('11111111-1111-4111-8111-111111111103','Gà','ga','🍗',3),
('11111111-1111-4111-8111-111111111104','Đồ uống','drink','🥤',4)
on conflict (slug) do nothing;
insert into public.choco_food_lab_restaurants (id,name,slug,description,image_url,is_open) values
('22222222-2222-4222-8222-222222222201','Cơm Nhà Phú Quốc','com-nha-phu-quoc','Món cơm gia đình','https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',true),
('22222222-2222-4222-8222-222222222202','Bún Phú Quốc','bun-phu-quoc','Các món bún','https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80',true),
('22222222-2222-4222-8222-222222222203','Gà Rán PQ','ga-ran-pq','Gà rán và combo','https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80',true),
('22222222-2222-4222-8222-222222222204','Choco Drinks','choco-drinks','Trà sữa và đồ uống','https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80',true)
on conflict (slug) do nothing;
insert into public.choco_food_lab_foods (id,restaurant_id,category_id,name,slug,description,price,image_url,is_available,sort_order) values
('33333333-3333-4333-8333-333333333101','22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111101','Cơm gà','com-ga','Cơm gà thơm ngon',45000,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',true,1),
('33333333-3333-4333-8333-333333333102','22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111101','Cơm sườn','com-suon','Cơm sườn',50000,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',true,2),
('33333333-3333-4333-8333-333333333103','22222222-2222-4222-8222-222222222201','11111111-1111-4111-8111-111111111101','Cơm thịt kho','com-thit-kho','Cơm thịt kho',45000,'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',true,3),
('33333333-3333-4333-8333-333333333201','22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111102','Bún bò','bun-bo','Bún bò',50000,'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80',true,1),
('33333333-3333-4333-8333-333333333202','22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111102','Bún thịt nướng','bun-thit-nuong','Bún thịt nướng',45000,'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80',true,2),
('33333333-3333-4333-8333-333333333203','22222222-2222-4222-8222-222222222202','11111111-1111-4111-8111-111111111102','Bún chả','bun-cha','Bún chả',50000,'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=600&q=80',true,3),
('33333333-3333-4333-8333-333333333301','22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111103','Gà rán','ga-ran','Gà rán',40000,'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80',true,1),
('33333333-3333-4333-8333-333333333302','22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111103','Gà sốt cay','ga-sot-cay','Gà sốt cay',45000,'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80',true,2),
('33333333-3333-4333-8333-333333333303','22222222-2222-4222-8222-222222222203','11111111-1111-4111-8111-111111111103','Combo gà','combo-ga','Combo gà',70000,'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80',true,3),
('33333333-3333-4333-8333-333333333401','22222222-2222-4222-8222-222222222204','11111111-1111-4111-8111-111111111104','Trà sữa','tra-sua','Trà sữa',30000,'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80',true,1),
('33333333-3333-4333-8333-333333333402','22222222-2222-4222-8222-222222222204','11111111-1111-4111-8111-111111111104','Trà đào','tra-dao','Trà đào',30000,'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80',true,2),
('33333333-3333-4333-8333-333333333403','22222222-2222-4333-8333-333333333403','11111111-1111-4111-8111-111111111104','Matcha','matcha','Matcha',35000,'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80',true,3)
on conflict (slug) do nothing;
