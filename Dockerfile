FROM scratch

COPY ./opla /srv/opla

WORKDIR /srv
#ENTRYPOINT ["/srv/opla"]

EXPOSE 8080
CMD ["/srv/opla", "serve", "--http=0.0.0.0:8080"]
