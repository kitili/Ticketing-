-- Run this if schema.sql failed with "policy already exists"
-- Safe to run anytime — only adds missing settings rows

INSERT INTO settings(key, value) VALUES
  ('pin_salt', 'silverleaf_ops_salt_v1'),
  ('manager_pin_hash', '5ed995e13af18cd70f3db881e3d785957310bebaf811e566f0b70ead8098236c'),
  ('ops_manager_email', 'baraka@silverleaf.co.tz'),
  ('ops_manager_phone', '+255762711796')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
