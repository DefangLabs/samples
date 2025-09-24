import io.javalin.Javalin;

public class App {
    public static void main(String[] args) {
        Javalin app = Javalin.create(config -> {
            config.addStaticFiles("/public", io.javalin.http.staticfiles.Location.CLASSPATH);
        }).start(7000);

        app.get("/", ctx -> {
            ctx.contentType("text/html");
            ctx.result(App.class.getResourceAsStream("/public/index.html"));
        });
    }
}
