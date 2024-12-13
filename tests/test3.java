import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/test3")
public class test3 extends HttpServlet {
    private static final String DB_URL = "jdbc:mysql://localhost:3306/vulnerable_db";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "password123";
    private static final String TOKEN = "admin";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.getWriter().write("Missing or invalid Authorization header");
            return;
        }

        String token = authHeader.substring(7);
        if (!TOKEN.equals(token)) {
            response.getWriter().write("Invalid token");
            return;
        }

        String username = request.getParameter("username");
        String query = "SELECT * FROM users WHERE username = '" + username + "'";

        try (Connection connection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             Statement statement = connection.createStatement()) {
            ResultSet resultSet = statement.executeQuery(query);
            if (resultSet.next()) {
                String userData = resultSet.getString("data");
                response.getWriter().write("Welcome, " + username + "! Your data: " + userData);
            } else {
                response.getWriter().write("User not found");
            }
        } catch (Exception e) {
            e.printStackTrace(response.getWriter());
        }
    }

    public static void main(String[] args) {
        System.out.println("Server is running on http://localhost:8080/");
    }
}
