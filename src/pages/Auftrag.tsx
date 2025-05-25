
import AuftragTemplate from '@/components/AuftragTemplate';
import { Auftrag } from '@/types/auftrag';

const AuftragPage = () => {
  // Statische Daten für die ursprüngliche Auftrag-Seite
  const staticAuftrag: Auftrag = {
    id: 'static',
    title: 'XXX',
    auftragsnummer: '093399: XXX',
    anbieter: 'Google',
    projektziel: 'Testen Sie die Funktionalität und Benutzerfreundlichkeit der offiziellen Google Keep App, indem Sie die Notizerstellung, Suchfunktionen und Synchronisationsmöglichkeiten untersuchen, um die Effizienz und Anwenderfreundlichkeit der App zu bewerten.',
    app_store_link: 'https://apps.apple.com/de/app/google-keep-notes-and-lists/id1029207872',
    google_play_link: 'https://play.google.com/store/apps/details?id=com.google.android.keep&hl=de&gl=DE',
    show_download_links: true,
    anweisungen: [
      {
        id: '1',
        title: 'App-Setup:',
        content: 'Installieren Sie die App und loggen Sie sich mit Ihrem Google-Konto ein, um auf alle Funktionen zugreifen zu können.',
        icon: 'Smartphone'
      },
      {
        id: '2',
        title: 'Notizerstellung und -verwaltung:',
        content: 'Testen Sie das Erstellen von Textnotizen, Listen und das Hinzufügen von Bildern oder Audioaufnahmen zu Ihren Notizen.'
      },
      {
        id: '3',
        title: 'Such- und Organisationsfunktionen:',
        content: 'Nutzen Sie die Suchfunktion, um spezifische Notizen schnell zu finden. Bewerten Sie, wie effektiv das Farbkodieren und das Labeln von Notizen bei der Organisation hilft.',
        icon: 'Search'
      },
      {
        id: '4',
        title: 'Synchronisation und plattformübergreifende Nutzung:',
        content: 'Überprüfen Sie die Synchronisationsfähigkeiten der App, indem Sie die Notizen auf verschiedenen Geräten (z.B. Telefon, Tablet, Web) bearbeiten und auf Konsistenz prüfen.',
        icon: 'RefreshCw'
      },
      {
        id: '5',
        title: 'Erinnerungen und Benachrichtigungen:',
        content: 'Setzen Sie Erinnerungen für bestimmte Notizen und testen Sie, wie gut die App Sie zu den gewünschten Zeiten benachrichtigt, einschließlich standortbasierter Erinnerungen.'
      }
    ],
    kontakt_name: 'Friedrich Hautmann',
    kontakt_email: 'f.hautmann@sls-advisors.net',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return <AuftragTemplate auftrag={staticAuftrag} />;
};

export default AuftragPage;
