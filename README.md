# TicketSystem-Oppdrag
TechSupport AS er et lite IT-selskap med 15 ansatte som leverer teknisk support til lokale bedrifter. Selskapet mottar daglig 20–30 henvendelser via e-post, telefon og chat. Uten et strukturert system har viktige saker blitt borte, noe som nylig førte til tap av en kontrakt verdt 50 000 kr.

Dette prosjektet er utviklet som en første versjon av et enkelt ticketsystem som gir bedre oversikt, tydelig ansvar og mulighet for videre utvikling.

# Mål med prosjektet 
- Gi TechSupport AS et fungerende TicketSystem
- Sikre innlogningen med brukerkontoer
- Gi oversikt over hvem som jobber med hvilken saker
- Legge til rette for videreutvikling via github
- Holde løsningen enkel og forståelig

# Teknologi brukt
- Html, Css og Javascript
- Python
- Maria DB
- Flask
- Git og Github

# Funksjonalitet 
## Brukerroller
- Brukere kan opprette og se sine egne tickets
- Drift arbeidere kan se alle tickets, ta ansvar og endre status
## Innlogning 
- Registrering
- Innlogning
- Utlogning
- Beskytte sider for innlogende brukere
## Tickets
### Vanlige brukere 
- Opprete ny ticket (Tittel og beskrivelse)
- Se egne tickets
- Se status på egne tickets
### Drift arbeidere 
- Se alle tickets i systemet
- Ta ansvar for en ticket
- Endre status på ticketen (Åpnet, lukket eller under arbeid)

# Forslag for videre utvikling 
- Sortere alle tickets med prioriteringssystem... (Kun drift/admin brukere som kan se prioriteringssytemet lav/middels/høy)
- Bedre logging og feilhåndteringssytem som kan gjøre det sånn at hvis det kommer samme problemet flere ganger kan man fikse det mye lettere og trenger ikke å gå gjennom alt hver eneste gang.
- Flere roller enn drift/admin... (lavere prioriterings saker kan takles av lavere roller mens høyere prioriteringer kan takles av høyere roller som admin)
- Varslinger på e-post eller SMS for når tickets blir lagt/fått svar/lukket.
- Automatisk varsling for arbeidere hvis en ticket ikke blir behandler på en stund. 
- Automatisk tildeling av tickts basert på hvilken prioritet som passer til hvilken rolle.
- Dark mode 

# Hva jeg har lært 
- Strukturering av kode for vidre utvikling
- Bruk av github for logging/dokumentasjon og versjonskontroll.
- Har fått mye bedre kontroll på Flask og Mariadb enn før.
??
