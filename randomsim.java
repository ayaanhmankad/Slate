import java.awt.*;
import java.awt.event.*;
import java.util.Random;
import javax.swing.*;

public class Firstproject extends JPanel {

    double x, y;
    double heading = 0;

    double targetX = 300, targetY = 300;

    final int ROBOT_SIZE = 15;
    final int RADIUS = ROBOT_SIZE / 2;

    double integral = 0;
    double lastError = 0;

    // Improved PID constants - better tuning to prevent oscillation
    double Kp = 0.8;
    double Ki = 0.05;
    double Kd = 1.2;

    int opMode = 0; // 0 AUTO, 1 TELEOP

    boolean forward, back, left, right;

    java.util.List<Rectangle> obstacles = new java.util.ArrayList<>();
    Random rand = new Random();

    // Track stuck state to escape
    private int stuckCounter = 0;
    private double lastX = 0, lastY = 0;
    private static final int STUCK_THRESHOLD = 30; // frames
    private double escapeHeading = 0;

    public Firstproject() {
        setFocusable(true);

        addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                if (opMode == 0) {
                    targetX = e.getX();
                    targetY = e.getY();
                }
            }
        });
    }

    void initWorld() {
        generateObstacles();
        spawnRobotSafe();
    }

    void spawnRobotSafe() {
        int w = getWidth();
        int h = getHeight();

        while (true) {
            x = 50 + rand.nextInt(Math.max(1, w - 100));
            y = 50 + rand.nextInt(Math.max(1, h - 100));

            if (!collides(x, y)) break;
        }
        lastX = x;
        lastY = y;
    }

    // =========================
    // OBSTACLES
    // =========================
    void generateObstacles() {
        obstacles.clear();

        int w = getWidth();
        int h = getHeight();

        int count = 28;

        for (int i = 0; i < count; i++) {
            int ow = 35 + rand.nextInt(75);
            int oh = 35 + rand.nextInt(75);

            int ox = rand.nextInt(Math.max(1, w - ow));
            int oy = rand.nextInt(Math.max(1, h - oh));

            Rectangle r = new Rectangle(ox, oy, ow, oh);

            boolean overlap = false;
            for (Rectangle o : obstacles) {
                if (o.intersects(r)) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) obstacles.add(r);
        }
    }

    // =========================
    void switchMode(int mode) {
        opMode = mode;
        integral = 0;
        lastError = 0;
        stuckCounter = 0;
    }

    void update() {
        if (opMode == 0) autoMove();
        else teleop();
        repaint();
    }

    // =========================
    void autoMove() {
        double dx = targetX - x;
        double dy = targetY - y;

        double dist = Math.hypot(dx, dy);
        if (dist < 5) return;

        // Detect if stuck
        double movementDist = Math.hypot(x - lastX, y - lastY);
        if (movementDist < 0.3) {
            stuckCounter++;
        } else {
            stuckCounter = 0;
        }

        lastX = x;
        lastY = y;

        // If stuck, try to escape
        if (stuckCounter > STUCK_THRESHOLD) {
            escapeHeading += 45;
            stuckCounter = 0;
        }

        // GOAL VECTOR
        double gx = dx / dist;
        double gy = dy / dist;

        // Obstacle avoidance vector
        double ax = 0;
        double ay = 0;

        for (Rectangle r : obstacles) {
            double cx = r.getCenterX();
            double cy = r.getCenterY();

            double ox = x - cx;
            double oy = y - cy;

            double d = Math.hypot(ox, oy);

            if (d < 130 && d > 0) {
                double strength = (130 - d) / 130.0;
                strength = strength * strength; // Smooth falloff

                double nx = ox / d;
                double ny = oy / d;

                ax += nx * strength;
                ay += ny * strength;

                // Tangential component for smoother flow
                ax += (-ny) * strength * 0.5;
                ay += (nx) * strength * 0.5;
            }
        }

        // Boundary repulsion (gentler)
        double m = 60;

        if (x < m) ax += (m - x) / (m * 1.5);
        if (x > getWidth() - m) ax -= (x - (getWidth() - m)) / (m * 1.5);

        if (y < m) ay += (m - y) / (m * 1.5);
        if (y > getHeight() - m) ay -= (y - (getHeight() - m)) / (m * 1.5);

        // COMBINE FIELD
        double fx = gx + ax * 1.5;
        double fy = gy + ay * 1.5;

        double mag = Math.hypot(fx, fy);

        // Emergency escape - only if truly stuck
        if (mag < 0.1 && stuckCounter > STUCK_THRESHOLD / 2) {
            fx = Math.cos(Math.toRadians(escapeHeading));
            fy = Math.sin(Math.toRadians(escapeHeading));
            mag = 1;
        }

        if (mag > 0.01) {
            fx /= mag;
            fy /= mag;
        }

        // PID HEADING CONTROLLER
        double desired = Math.toDegrees(Math.atan2(fy, fx));
        double error = normalizeAngle(desired - heading);

        integral += error * 0.02; // Dampen integral
        integral = Math.max(-50, Math.min(50, integral)); // Clamp integral

        double derivative = error - lastError;

        double turn = Kp * error + Ki * integral + Kd * derivative;
        lastError = error;

        // Smooth heading updates
        heading += turn * 0.08;
        heading = normalizeAngle(heading);

        // ADAPTIVE SPEED based on obstacle proximity and error
        double obstacleInfluence = calculateObstacleInfluence();
        double speedFactor = Math.max(0.3, 1.0 - (obstacleInfluence * 0.7));
        double speed = Math.min(3.0, dist * 0.05) * speedFactor;

        // If heading error is large, reduce speed
        if (Math.abs(error) > 45) {
            speed *= 0.6;
        }

        double rad = Math.toRadians(heading);

        double nx = x + Math.cos(rad) * speed;
        double ny = y + Math.sin(rad) * speed;

        if (!collides(nx, ny)) {
            x = nx;
            y = ny;
        } else {
            // Try perpendicular directions when blocked
            double tryHeading = heading + 30;
            double tryRad = Math.toRadians(tryHeading);
            double tnx = x + Math.cos(tryRad) * speed;
            double tny = y + Math.sin(tryRad) * speed;

            if (!collides(tnx, tny)) {
                x = tnx;
                y = tny;
                heading = tryHeading;
            } else {
                tryHeading = heading - 30;
                tryRad = Math.toRadians(tryHeading);
                tnx = x + Math.cos(tryRad) * speed;
                tny = y + Math.sin(tryRad) * speed;

                if (!collides(tnx, tny)) {
                    x = tnx;
                    y = tny;
                    heading = tryHeading;
                }
            }
        }
    }

    double calculateObstacleInfluence() {
        double influence = 0;
        for (Rectangle r : obstacles) {
            double cx = r.getCenterX();
            double cy = r.getCenterY();
            double d = Math.hypot(x - cx, y - cy);
            if (d < 150) {
                influence += (150 - d) / 150.0;
            }
        }
        return Math.min(1.0, influence);
    }

    // =========================
    void teleop() {
        double speed = 3;

        if (left) heading -= 3;
        if (right) heading += 3;

        double rad = Math.toRadians(heading);

        double move = 0;
        if (forward) move += speed;
        if (back) move -= speed;

        double nx = x + Math.cos(rad) * move;
        double ny = y + Math.sin(rad) * move;

        if (!collides(nx, ny)) {
            x = nx;
            y = ny;
        }
    }

    // =========================
    boolean collides(double nx, double ny) {
        if (nx < RADIUS || ny < RADIUS || nx > getWidth() - RADIUS || ny > getHeight() - RADIUS)
            return true;

        Rectangle bot = new Rectangle((int) (nx - RADIUS), (int) (ny - RADIUS), ROBOT_SIZE, ROBOT_SIZE);

        for (Rectangle r : obstacles) {
            if (bot.intersects(r)) return true;
        }

        return false;
    }

    double normalizeAngle(double a) {
        while (a > 180) a -= 360;
        while (a < -180) a += 360;
        return a;
    }

    // =========================
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);

        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Background gradient
        GradientPaint gp = new GradientPaint(0, 0, new Color(25, 45, 85),
                getWidth(), getHeight(), new Color(15, 30, 60));
        g2.setPaint(gp);
        g2.fillRect(0, 0, getWidth(), getHeight());

        // Border
        g2.setColor(Color.WHITE);
        g2.setStroke(new BasicStroke(2));
        g2.drawRect(0, 0, getWidth() - 1, getHeight() - 1);

        // Draw obstacles with gradient
        for (Rectangle r : obstacles) {
            GradientPaint obstacleGp = new GradientPaint(r.x, r.y, new Color(80, 80, 80),
                    r.x + r.width, r.y + r.height, new Color(40, 40, 40));
            g2.setPaint(obstacleGp);
            g2.fillRect(r.x, r.y, r.width, r.height);

            g2.setColor(new Color(100, 100, 100));
            g2.setStroke(new BasicStroke(1));
            g2.drawRect(r.x, r.y, r.width - 1, r.height - 1);
        }

        // Draw target
        g2.setColor(new Color(255, 50, 50));
        g2.fillOval((int) targetX - 6, (int) targetY - 6, 12, 12);
        g2.setColor(new Color(255, 100, 100));
        g2.drawOval((int) targetX - 10, (int) targetY - 10, 20, 20);

        // Draw robot
        g2.setColor(Color.BLACK);
        g2.fillOval((int) x - RADIUS, (int) y - RADIUS, ROBOT_SIZE, ROBOT_SIZE);

        // Robot direction indicator
        g2.setColor(Color.YELLOW);
        int lx = (int) (x + Math.cos(Math.toRadians(heading)) * 12);
        int ly = (int) (y + Math.sin(Math.toRadians(heading)) * 12);
        g2.setStroke(new BasicStroke(2));
        g2.drawLine((int) x, (int) y, lx, ly);

        // Draw info panel
        g2.setColor(new Color(0, 0, 0, 180));
        g2.fillRect(10, 10, 400, 80);

        g2.setColor(Color.WHITE);
        g2.setFont(new Font("Arial", Font.PLAIN, 12));
        g2.drawString("ENTER=AUTO | SPACE=TELEOP | CLICK=TARGET", 20, 28);
        g2.drawString("WASD=Move | Arrow Keys=Rotate", 20, 43);
        g2.drawString("Mode: " + (opMode == 0 ? "AUTO" : "TELEOP"), 20, 58);
        g2.drawString(String.format("Pos: %.0f, %.0f | Heading: %.0f°", x, y, heading), 20, 73);
    }

    // =========================
    public static void main(String[] args) {

        Firstproject panel = new Firstproject();

        JFrame frame = new JFrame("Robot Simulator - Pathfinding");
        frame.setSize(900, 900);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.add(panel);
        frame.setVisible(true);

        javax.swing.Timer init = new javax.swing.Timer(100, e -> {
            if (panel.getWidth() > 0) {
                panel.initWorld();
                ((javax.swing.Timer) e.getSource()).stop();
            }
        });
        init.start();

        panel.requestFocusInWindow();

        panel.addKeyListener(new KeyAdapter() {

            @Override
            public void keyPressed(KeyEvent e) {
                switch (e.getKeyCode()) {
                    case KeyEvent.VK_W -> panel.forward = true;
                    case KeyEvent.VK_S -> panel.back = true;
                    case KeyEvent.VK_A -> panel.left = true;
                    case KeyEvent.VK_D -> panel.right = true;
                    case KeyEvent.VK_ENTER -> panel.switchMode(0);
                    case KeyEvent.VK_SPACE -> panel.switchMode(1);
                }
            }

            @Override
            public void keyReleased(KeyEvent e) {
                switch (e.getKeyCode()) {
                    case KeyEvent.VK_W -> panel.forward = false;
                    case KeyEvent.VK_S -> panel.back = false;
                    case KeyEvent.VK_A -> panel.left = false;
                    case KeyEvent.VK_D -> panel.right = false;
                }
            }
        });

        new javax.swing.Timer(20, e -> panel.update()).start();
    }
}