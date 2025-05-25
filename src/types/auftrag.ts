
export interface Anweisung {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

export interface Auftrag {
  id: string;
  title: string;
  auftragsnummer: string;
  anbieter: string;
  projektziel: string;
  app_store_link?: string;
  google_play_link?: string;
  show_download_links: boolean;
  anweisungen: Anweisung[];
  kontakt_name: string;
  kontakt_email: string;
  created_at: string;
  updated_at: string;
}

export interface AuftragFormData {
  title: string;
  auftragsnummer: string;
  anbieter: string;
  projektziel: string;
  app_store_link?: string;
  google_play_link?: string;
  show_download_links: boolean;
  anweisungen: Anweisung[];
  kontakt_name: string;
  kontakt_email: string;
}
