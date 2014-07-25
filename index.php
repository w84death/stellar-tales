<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <title>Raspberry Pi @ Turkusowa</title>
  <meta name="description" content="Raspberry Pi Server @ Turkusowa" />
  <link rel="stylesheet" href="/app.css"/>
</head>
<body>
  <header>
    <h1>Raspberry Pi @ Turkusowa</h1>
  </header>
  <article>
    <h2>Welcome</h2>
    <p>Server is working. List of services:</p>
    <ul>
      <li>NGINX
      <li>FTP
      <li>Node.js
      <li>Mumble
      <li>BitTorrent Sync
    </ul>
  </article>

  <article>
    <h3>P1X GAMES</h3>
    <p>We host Stellar Tales server and client on this Raspberry Pi.<br/>
    It is a massive multiplayer space simulation game. It uses only text<br/>
    for visual effects so it's highly dependent on players imagination.</p>
    <ul>
      <li><a href="http://194.126.207.20:1337">Stellar Tales</a>
    </ul>
    <p>Check out all P1X games at <a href="http://p1x.in">http://p1x.in</a>.</p>
  </article>

  <footer>
    <p><?php echo shell_exec('uptime'); ?>, CPU <?php echo round(exec("cat /sys/class/thermal/thermal_zone0/temp ") / 1000, 1); ?>&deg;C</p>
  </footer>
</body>
</html>
