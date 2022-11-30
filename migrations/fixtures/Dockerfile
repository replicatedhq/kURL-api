FROM schemahero/schemahero:0.14.0-alpha.1 as builder

COPY --chown=schemahero:schemahero ./kustomize/schema schema
RUN /schemahero fixtures --dbname replicated --driver mysql --input-dir schema --output-dir /home/schemahero

FROM mysql:8

ENV MYSQL_USER=replicated
ENV MYSQL_PASSWORD=password
ENV MYSQL_DATABASE=replicated
ENV MYSQL_RANDOM_ROOT_PASSWORD=1

## Insert fixtures
COPY --from=builder --chown=mysql:mysql /home/schemahero/fixtures.sql /docker-entrypoint-initdb.d/
COPY ./fixtures/docker.cnf /etc/mysql/conf.d
