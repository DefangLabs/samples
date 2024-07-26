DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nocodb') THEN
      CREATE DATABASE nocodb;
   END IF;
END
$do$;
