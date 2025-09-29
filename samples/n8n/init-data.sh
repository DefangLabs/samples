#!/bin/bash
set -e;


if [ -n "${POSTGRES_NON_ROOT_USER:-}" ] && [ -n "${POSTGRES_NON_ROOT_PASSWORD:-}" ]; then
	# Retry logic with maximum 20 attempts and 3-second delays
	max_attempts=20
	attempt=1
	
	while [ $attempt -le $max_attempts ]; do
		echo "Attempt $attempt of $max_attempts to initialize database..."
		
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
			echo "Database initialization failed on attempt $attempt"
			if [ $attempt -lt $max_attempts ]; then
				echo "Waiting 3 seconds before retry..."
				sleep 3
			else
				echo "All $max_attempts attempts failed. Exiting."
				exit 1
			fi
		fi
		
		attempt=$((attempt + 1))
	done
else
	echo "SETUP INFO: No Environment variables given!"
fi
