FROM postgres:16

COPY init-data.sh /

ENTRYPOINT ["sh", "-c"]
