#!/bin/bash
set -e;


if [ -n "${POSTGRES_NON_ROOT_USER:-}" ] && [ -n "${POSTGRES_NON_ROOT_PASSWORD:-}" ]; then
	attempt=1
	max_attempts=200
	delay_seconds=3
	
	while [ $attempt -le $max_attempts ]; do
		echo "Database initialization attempt $attempt"
		
		# Show patience message on first attempt and every 5 attempts
		if [ $attempt -eq 1 ] || [ $((attempt % 5)) -eq 0 ]; then
			echo "First time deploying managed postgres may take up to 10 minutes on first initialization, please be patient."
		fi
		
		# Check if user already exists first
		if psql -v ON_ERROR_STOP=1 --host="$POSTGRES_HOST" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_NON_ROOT_USER}'" | grep -q 1; then
			echo "User ${POSTGRES_NON_ROOT_USER} already exists, skipping database initialization"
			exit 0
		fi
		
		# Need to add --host because it is run in a separate container
		if psql -v ON_ERROR_STOP=1 --host="$POSTGRES_HOST" --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
			CREATE USER ${POSTGRES_NON_ROOT_USER} WITH PASSWORD '${POSTGRES_NON_ROOT_PASSWORD}';
			GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_NON_ROOT_USER};
			GRANT CREATE ON SCHEMA public TO ${POSTGRES_NON_ROOT_USER};
		EOSQL
		then
			echo "Database initialization successful on attempt $attempt"
			break
		else
			if [ $attempt -lt $max_attempts ]; then
				sleep $delay_seconds
			else
				echo "All $max_attempts attempts failed. Exiting."
				echo "Please initialize another defang deployment since the managed postgres may be ready on the next deployment."
				exit 1
			fi
		fi
		
		attempt=$((attempt + 1))
	done
else
	echo "SETUP INFO: No Environment variables given!"
fi
