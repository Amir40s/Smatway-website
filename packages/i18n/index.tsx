"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { extraPhrases } from "./extraPhrases";

export type Locale = "en" | "fr" | "pt" | "ar" | "sw" | "ha" | "es";

export const locales: { code: Locale; label: string; nativeLabel: string; rtl?: boolean }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", rtl: true },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili" },
  { code: "ha", label: "Hausa", nativeLabel: "Hausa" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.some((locale) => locale.code === value);
}

type DictionaryBundle = Partial<Record<Locale, Record<string, string>>>;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  translateText: (text: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const defaultStorageKey = "smatway:locale";

const exactPhrases: Record<string, Partial<Record<Exclude<Locale, "en">, string>>> = {
  "Vacancies": { fr: "Offres d'emploi", pt: "Vagas", ar: "الوظائف الشاغرة", sw: "Nafasi za Kazi", ha: "Gurbin Aiki", es: "Vacantes" },
  "Looking for Your Next Opportunity?": { fr: "À la recherche de votre prochaine opportunité ?", pt: "Procurando sua próxima oportunidade?", ar: "هل تبحث عن فرصتك القادمة؟", sw: "Unatafuta Fursa Yako Inayofuata?", ha: "Kuna neman damar aiki na gaba?", es: "¿Buscando tu próxima oportunidad?" },
  "Submit your CV today and we'll connect you with employers seeking qualified talent.": { fr: "Soumettez votre CV aujourd'hui et nous vous mettrons en contact avec des employeurs.", pt: "Envie seu currículo hoje e nós o conectaremos com empregadores.", ar: "أرسل سيرتك الذاتية اليوم وسنقوم بتوصيلك بأصحاب العمل الذين يبحثون عن المواهب المؤهلة.", sw: "Tuma CV yako leo na tutakuunganisha na waajiri.", ha: "Sanya CV dinka yau don mu haɗa ka da masu daukan aiki.", es: "Envía tu CV hoy y te conectaremos con empleadores." },
  "General Vacancies": { fr: "Offres Générales", pt: "Vagas Gerais", ar: "وظائف عامة", sw: "Nafasi za Kazi za Kawaida", ha: "Gurbin Aiki na Gaba ɗaya", es: "Vacantes Generales" },
  "Looking for employment? Submit your CV to be considered for current and future opportunities across various roles in our organization and partner network.": { fr: "Vous cherchez un emploi ? Soumettez votre CV pour être considéré.", pt: "Procurando emprego? Envie seu currículo para ser considerado.", ar: "هل تبحث عن عمل؟ أرسل سيرتك الذاتية ليتم أخذك بعين الاعتبار للفرص الحالية والمستقبلية عبر مختلف الأدوار في مؤسستنا وشبكة شركائنا.", sw: "Unatafuta ajira? Tuma CV yako.", ha: "Kuna neman aiki? Sanya CV ɗin ku.", es: "¿Buscas empleo? Envía tu CV para ser considerado." },
  "Submit Your CV": { fr: "Soumettre Votre CV", pt: "Enviar Seu Currículo", ar: "إرسال السيرة الذاتية", sw: "Tuma CV Yako", ha: "Sanya CV ɗin ku", es: "Enviar tu CV" },
  "Driver Vacancies": { fr: "Offres pour Chauffeurs", pt: "Vagas para Motoristas", ar: "وظائف السائقين", sw: "Nafasi za Kazi za Madereva", ha: "Gurbin Aikin Direbobi", es: "Vacantes para Conductores" },
  "Are you a professional driver looking for your next job? Submit your CV today and we'll connect you with employers seeking qualified drivers.": { fr: "Êtes-vous un chauffeur professionnel ? Soumettez votre CV aujourd'hui.", pt: "Você é um motorista profissional? Envie seu currículo hoje.", ar: "هل أنت سائق محترف تبحث عن وظيفتك القادمة؟ أرسل سيرتك الذاتية اليوم وسنقوم بتوصيلك بأصحاب العمل الذين يبحثون عن سائقين مؤهلين.", sw: "Je, wewe ni dereva mtaalamu? Tuma CV yako leo.", ha: "Kai ƙwararren direba ne? Sanya CV ɗin ku a yau.", es: "¿Eres un conductor profesional? Envía tu CV hoy." },
  "How Can We Help You?": { fr: "Comment pouvons-nous vous aider ?", pt: "Como podemos ajudá-lo?", ar: "كيف يمكننا مساعدتك؟", sw: "Tunawezaje kukusaidia?", ha: "Ta yaya zamu taimaka muku?", es: "¿Cómo podemos ayudarte?" },
  "Choose the option that best describes you.": { fr: "Choisissez l'option qui vous décrit le mieux.", pt: "Escolha a opção que melhor descreve você.", ar: "اختر الخيار الذي يصفك بشكل أفضل.", sw: "Chagua chaguo linalokufafanua vyema.", ha: "Zaɓi zaɓi wanda ya fi dacewa da kai.", es: "Elige la opción que mejor te describa." },
  "Looking for Employment?": { fr: "À la recherche d'un emploi ?", pt: "Procurando Emprego?", ar: "هل تبحث عن عمل؟", sw: "Unatafuta Ajira?", ha: "Kuna neman Aiki?", es: "¿Buscas Empleo?" },
  "Send us your CV and we'll consider you for current and future opportunities.": { fr: "Envoyez-nous votre CV et nous vous considérerons pour les opportunités.", pt: "Envie-nos seu currículo e o consideraremos para oportunidades.", ar: "أرسل لنا سيرتك الذاتية وسنأخذك بعين الاعتبار للفرص الحالية والمستقبلية.", sw: "Tutumie CV yako na tutakufikiria kwa fursa.", ha: "Aiko mana da CV dinka kuma za mu duba ka don damar aiki.", es: "Envíanos tu CV y te consideraremos para oportunidades." },
  "Driver Seeking Employment?": { fr: "Chauffeur cherchant un emploi ?", pt: "Motorista Procurando Emprego?", ar: "سائق يبحث عن عمل؟", sw: "Dereva Anayetafuta Ajira?", ha: "Direba na Neman Aiki?", es: "¿Conductor Buscando Empleo?" },
  "Send us your CV and we help connect you with transport companies looking for qualified drivers.": { fr: "Envoyez-nous votre CV et nous vous mettons en contact avec des entreprises de transport.", pt: "Envie-nos seu currículo e nós o conectaremos com empresas de transporte.", ar: "أرسل لنا سيرتك الذاتية وسنساعدك في التواصل مع شركات النقل التي تبحث عن سائقين مؤهلين.", sw: "Tutumie CV yako na tunakusaidia kukuunganisha na kampuni za usafiri.", ha: "Aiko mana da CV dinka kuma za mu taimaka wajen haɗa ka da kamfanonin sufuri.", es: "Envíanos tu CV y te ayudamos a conectar con empresas de transporte." },
  "Need Drivers?": { fr: "Besoin de Chauffeurs ?", pt: "Precisa de Motoristas?", ar: "هل تحتاج إلى سائقين؟", sw: "Unahitaji Madereva?", ha: "Kuna buƙatar Direbobi?", es: "¿Necesitas Conductores?" },
  "Transport Company Looking for Drivers? Send us your requirements, and we'll help connect you with suitable driver candidates.": { fr: "Entreprise de transport cherchant des chauffeurs ? Envoyez-nous vos exigences.", pt: "Empresa de Transporte Procurando Motoristas? Envie-nos seus requisitos.", ar: "شركة نقل تبحث عن سائقين؟ أرسل لنا متطلباتك، وسنساعدك في العثور على مرشحين مناسبين.", sw: "Kampuni ya Usafiri Inatafuta Madereva? Tutumie mahitaji yako.", ha: "Kamfanin Sufuri na Neman Direbobi? Aiko mana da buƙatunku.", es: "¿Empresa de Transporte Buscando Conductores? Envíanos tus requisitos." },
  "Email Us Your Requirements": { fr: "Envoyez-nous vos exigences par e-mail", pt: "Envie-nos seus requisitos por e-mail", ar: "أرسل لنا متطلباتك عبر البريد الإلكتروني", sw: "Tutumie Mahitaji Yako kwa Barua Pepe", ha: "Aiko Mana Da Buƙatunku Ta Imel", es: "Envíanos tus requisitos por correo electrónico" },
  "Send Email to:": { fr: "Envoyer un e-mail à :", pt: "Enviar e-mail para:", ar: "إرسال بريد إلكتروني إلى:", sw: "Tuma Barua Pepe kwa:", ha: "Aika Imel zuwa:", es: "Enviar correo electrónico a:" },
  "Terms of Use and Conditions": { fr: "Conditions d'utilisation", pt: "Termos de Uso e Condições", ar: "شروط الاستخدام والأحكام", sw: "Masharti na Vigezo vya Matumizi", ha: "Sharuɗɗa da Ka'idojin Amfani", es: "Términos de Uso y Condiciones" },
  "Privacy Policy": { fr: "Politique de confidentialité", pt: "Política de Privacidade", ar: "سياسة الخصوصية", sw: "Sera ya Faragha", ha: "Sufofin Tsare Sirri", es: "Política de Privacidad" },
  "Imprint": { fr: "Mentions légales", pt: "Impressão", ar: "بصمة", sw: "Imprint", ha: "Buga", es: "Impronta" },
  "Transporter Code of Conduct": { fr: "Code de conduite du transporteur", pt: "Código de Conduta do Transportador", ar: "مدونة قواعد سلوك الناقل", sw: "Kanuni za Maadili kwa Msafirishaji", ha: "Dokokin Da'a Na Mai Safara", es: "Código de Conducta del Transportista" },
  "Traveller Code of Conduct": { fr: "Code de conduite du voyageur", pt: "Código de Conduta do Viajante", ar: "مدونة قواعد سلوك المسافر", sw: "Kanuni za Maadili kwa Msafiri", ha: "Dokokin Da'a Na Mai Tafiya", es: "Código de Conducta del Viajero" },
  "Access Denied": { fr: "Accès refusé", pt: "Acesso negado", ar: "تم رفض الوصول", sw: "Ufikiaji umekataliwa", ha: "An hana samun dama", es: "Acceso denegado" },
  "Actions": { fr: "Actions", pt: "Ações", ar: "الإجراءات", sw: "Vitendo", ha: "Ayyuka", es: "Acciones" },
  "Active": { fr: "Actif", pt: "Ativo", ar: "نشط", sw: "Inatumika", ha: "Mai aiki", es: "Activo" },
  "Active Bookings": { fr: "Réservations actives", pt: "Reservas ativas", ar: "الحجوزات النشطة", sw: "Nafasi zilizohifadhiwa zinazoendelea", ha: "Ajiyoyi masu aiki", es: "Reservas activas" },
  "Active routes": { fr: "Itinéraires actifs", pt: "Rotas ativas", ar: "المسارات النشطة", sw: "Njia hai", ha: "Hanyoyi masu aiki", es: "Rutas activas" },
  "Account": { fr: "Compte", pt: "Conta", ar: "الحساب", sw: "Akaunti", ha: "Asusu", es: "Cuenta" },
  "Account Holder Name": { fr: "Nom du titulaire du compte", pt: "Nome do titular da conta", ar: "اسم صاحب الحساب", sw: "Jina la mwenye akaunti", ha: "Sunan mai asusu", es: "Nombre del titular de la cuenta" },
  "Account Number": { fr: "Numéro de compte", pt: "Número da conta", ar: "رقم الحساب", sw: "Nambari ya akaunti", ha: "Lambar asusu", es: "Número de cuenta" },
  "Account Type": { fr: "Type de compte", pt: "Tipo de conta", ar: "نوع الحساب", sw: "Aina ya akaunti", ha: "Nau'in asusu", es: "Tipo de cuenta" },
  "Address": { fr: "Adresse", pt: "Endereço", ar: "العنوان", sw: "Anwani", ha: "Adireshi", es: "Dirección" },
  "Analytics": { fr: "Analytique", pt: "Análises", ar: "التحليلات", sw: "Uchanganuzi", ha: "Nazari", es: "Analítica" },
  "Arrival": { fr: "Arrivée", pt: "Chegada", ar: "الوصول", sw: "Kuwasili", ha: "Isa", es: "Llegada" },
  "Arrival City": { fr: "Ville d'arrivée", pt: "Cidade de chegada", ar: "مدينة الوصول", sw: "Jiji la kuwasili", ha: "Garin isa", es: "Ciudad de llegada" },
  "Audit": { fr: "Audit", pt: "Auditoria", ar: "التدقيق", sw: "Ukaguzi", ha: "Bincike", es: "Auditoría" },
  "Activity Logs": { fr: "Journaux d'activité", pt: "Registros de atividade", ar: "سجلات النشاط", sw: "Kumbukumbu za shughuli", ha: "Bayanan ayyuka", es: "Registros de actividad" },
  "Add": { fr: "Ajouter", pt: "Adicionar", ar: "إضافة", sw: "Ongeza", ha: "Ƙara", es: "Añadir" },
  "Add contact": { fr: "Ajouter un contact", pt: "Adicionar contato", ar: "إضافة جهة اتصال", sw: "Ongeza mawasiliano", ha: "Ƙara lamba", es: "Añadir contacto" },
  "Add More": { fr: "Ajouter plus", pt: "Adicionar mais", ar: "إضافة المزيد", sw: "Ongeza zaidi", ha: "Ƙara ƙari", es: "Añadir más" },
  "Add New Route": { fr: "Ajouter un itinéraire", pt: "Adicionar nova rota", ar: "إضافة مسار جديد", sw: "Ongeza njia mpya", ha: "Ƙara sabuwar hanya", es: "Añadir nueva ruta" },
  "Add New Vehicle": { fr: "Ajouter un véhicule", pt: "Adicionar novo veículo", ar: "إضافة مركبة جديدة", sw: "Ongeza gari jipya", ha: "Ƙara sabon abin hawa", es: "Añadir nuevo vehículo" },
  "Add Photos": { fr: "Ajouter des photos", pt: "Adicionar fotos", ar: "إضافة صور", sw: "Ongeza picha", ha: "Ƙara hotuna", es: "Añadir fotos" },
  "Add Stop": { fr: "Ajouter un arrêt", pt: "Adicionar parada", ar: "إضافة محطة", sw: "Ongeza kituo", ha: "Ƙara tasha", es: "Añadir parada" },
  "Add vehicle": { fr: "Ajouter un véhicule", pt: "Adicionar veículo", ar: "إضافة مركبة", sw: "Ongeza gari", ha: "Ƙara abin hawa", es: "Añadir vehículo" },
  "Admin": { fr: "Admin", pt: "Admin", ar: "المشرف", sw: "Msimamizi", ha: "Admin", es: "Admin" },
  "Admin Access": { fr: "Accès administrateur", pt: "Acesso administrativo", ar: "وصول المشرف", sw: "Ufikiaji wa msimamizi", ha: "Samun damar admin", es: "Acceso de administrador" },
  "Admin Hub": { fr: "Centre admin", pt: "Central admin", ar: "مركز المشرف", sw: "Kituo cha msimamizi", ha: "Cibiyar admin", es: "Centro admin" },
  "Administrative Actions": { fr: "Actions administratives", pt: "Ações administrativas", ar: "إجراءات إدارية", sw: "Vitendo vya usimamizi", ha: "Ayyukan gudanarwa", es: "Acciones administrativas" },
  "All Assigned Routes": { fr: "Tous les itinéraires assignés", pt: "Todas as rotas atribuídas", ar: "كل المسارات المعينة", sw: "Njia zote ulizopangiwa", ha: "Dukkan hanyoyin da aka ba ka", es: "Todas las rutas asignadas" },
  "All Booking Statuses": { fr: "Tous les statuts de réservation", pt: "Todos os status de reserva", ar: "كل حالات الحجز", sw: "Hali zote za kuhifadhi", ha: "Dukkan matsayin ajiya", es: "Todos los estados de reserva" },
  "All Feedback": { fr: "Tous les retours", pt: "Todos os comentários", ar: "كل الملاحظات", sw: "Maoni yote", ha: "Dukkan martani", es: "Todos los comentarios" },
  "All Stars": { fr: "Toutes les notes", pt: "Todas as estrelas", ar: "كل النجوم", sw: "Nyota zote", ha: "Dukkan taurari", es: "Todas las estrellas" },
  "All types": { fr: "Tous les types", pt: "Todos os tipos", ar: "كل الأنواع", sw: "Aina zote", ha: "Dukkan nau'i", es: "Todos los tipos" },
  "Amount": { fr: "Montant", pt: "Valor", ar: "المبلغ", sw: "Kiasi", ha: "Adadi", es: "Importe" },
  "Announcement Title": { fr: "Titre de l'annonce", pt: "Título do anúncio", ar: "عنوان الإعلان", sw: "Kichwa cha tangazo", ha: "Taken sanarwa", es: "Título del anuncio" },
  "Announcements": { fr: "Annonces", pt: "Anúncios", ar: "الإعلانات", sw: "Matangazo", ha: "Sanarwa", es: "Anuncios" },
  "Approve": { fr: "Approuver", pt: "Aprovar", ar: "موافقة", sw: "Idhinisha", ha: "Amince", es: "Aprobar" },
  "Are you sure you want to delete this announcement?": { fr: "Voulez-vous vraiment supprimer cette annonce ?", pt: "Tem certeza de que deseja excluir este anúncio?", ar: "هل أنت متأكد أنك تريد حذف هذا الإعلان؟", sw: "Una uhakika unataka kufuta tangazo hili?", ha: "Ka tabbata kana son goge wannan sanarwar?", es: "¿Seguro que quieres eliminar este anuncio?" },
  "Are you sure you want to delete this review? This action is permanent and will remove it from the platform.": { fr: "Voulez-vous vraiment supprimer cet avis ? Cette action est permanente et le retirera de la plateforme.", pt: "Tem certeza de que deseja excluir esta avaliação? Esta ação é permanente e a removerá da plataforma.", ar: "هل تريد بالتأكيد حذف هذه المراجعة؟ هذا الإجراء دائم وسيزيلها من المنصة.", sw: "Una uhakika unataka kufuta tathmini hii? Hatua hii ni ya kudumu na itaiondoa kwenye jukwaa.", ha: "Ka tabbata kana son goge wannan bita? Wannan aikin na dindindin ne kuma zai cire ta daga dandali.", es: "¿Seguro que quieres eliminar esta reseña? Esta acción es permanente y la quitará de la plataforma." },
  "Back to home": { fr: "Retour à l'accueil", pt: "Voltar ao início", ar: "العودة للرئيسية", sw: "Rudi mwanzo", ha: "Koma gida", es: "Volver al inicio" },
  "Back to Home": { fr: "Retour à l'accueil", pt: "Voltar ao início", ar: "العودة للرئيسية", sw: "Rudi mwanzo", ha: "Koma gida", es: "Volver al inicio" },
  "Back to sign in": { fr: "Retour à la connexion", pt: "Voltar ao login", ar: "العودة لتسجيل الدخول", sw: "Rudi kuingia", ha: "Koma shiga", es: "Volver a iniciar sesión" },
  "Bank Name": { fr: "Nom de la banque", pt: "Nome do banco", ar: "اسم البنك", sw: "Jina la benki", ha: "Sunan banki", es: "Nombre del banco" },
  "Bank": { fr: "Banque", pt: "Banco", ar: "البنك", sw: "Benki", ha: "Banki", es: "Banco" },
  "Booked": { fr: "Réservé", pt: "Reservado", ar: "محجوز", sw: "Imehifadhiwa", ha: "An yi ajiya", es: "Reservado" },
  "Booking #": { fr: "Réservation n°", pt: "Reserva nº", ar: "الحجز رقم", sw: "Uhifadhi #", ha: "Ajiya #", es: "Reserva n.º" },
  "Booking": { fr: "Réservation", pt: "Reserva", ar: "حجز", sw: "Kuhifadhi", ha: "Ajiya", es: "Reserva" },
  "Booking Details": { fr: "Détails de la réservation", pt: "Detalhes da reserva", ar: "تفاصيل الحجز", sw: "Maelezo ya kuhifadhi", ha: "Bayanan ajiya", es: "Detalles de la reserva" },
  "Booking History": { fr: "Historique des réservations", pt: "Histórico de reservas", ar: "سجل الحجوزات", sw: "Historia ya kuhifadhi", ha: "Tarihin ajiyar wuri", es: "Historial de reservas" },
  "Booking ID": { fr: "ID de réservation", pt: "ID da reserva", ar: "معرّف الحجز", sw: "Kitambulisho cha kuhifadhi", ha: "Lambar ajiya", es: "ID de reserva" },
  "Booking not found": { fr: "Réservation introuvable", pt: "Reserva não encontrada", ar: "الحجز غير موجود", sw: "Uhifadhi haukupatikana", ha: "Ba a sami ajiya ba", es: "Reserva no encontrada" },
  "Bookings": { fr: "Réservations", pt: "Reservas", ar: "الحجوزات", sw: "Nafasi zilizohifadhiwa", ha: "Ajiyoyi", es: "Reservas" },
  "Broadcast": { fr: "Diffusion", pt: "Transmissão", ar: "بث", sw: "Tangazo", ha: "Yaɗawa", es: "Difusión" },
  "Broadcasts": { fr: "Diffusions", pt: "Transmissões", ar: "البثوث", sw: "Matangazo", ha: "Yaɗe-yaɗe", es: "Difusiones" },
  "Bus": { fr: "Bus", pt: "Ônibus", ar: "حافلة", sw: "Basi", ha: "Bas", es: "Autobús" },
  "Cancel": { fr: "Annuler", pt: "Cancelar", ar: "إلغاء", sw: "Ghairi", ha: "Soke", es: "Cancelar" },
  "Cancel this booking?": { fr: "Annuler cette réservation ?", pt: "Cancelar esta reserva?", ar: "إلغاء هذا الحجز؟", sw: "Ughairi nafasi hii?", ha: "A soke wannan ajiya?", es: "¿Cancelar esta reserva?" },
  "Cancelled": { fr: "Annulé", pt: "Cancelado", ar: "ملغى", sw: "Imeghairiwa", ha: "An soke", es: "Cancelado" },
  "Captured": { fr: "Capturé", pt: "Capturado", ar: "تم التقاطه", sw: "Imenaswa", ha: "An kama", es: "Capturado" },
  "Cash": { fr: "Espèces", pt: "Dinheiro", ar: "نقدًا", sw: "Fedha taslimu", ha: "Kuɗi hannu", es: "Efectivo" },
  "Changes": { fr: "Modifications", pt: "Alterações", ar: "التغييرات", sw: "Mabadiliko", ha: "Canje-canje", es: "Cambios" },
  "Car": { fr: "Voiture", pt: "Carro", ar: "سيارة", sw: "Gari", ha: "Mota", es: "Coche" },
  "Change language": { fr: "Changer de langue", pt: "Alterar idioma", ar: "تغيير اللغة", sw: "Badilisha lugha", ha: "Canza harshe", es: "Cambiar idioma" },
  "Close": { fr: "Fermer", pt: "Fechar", ar: "إغلاق", sw: "Funga", ha: "Rufe", es: "Cerrar" },
  "Close Form": { fr: "Fermer le formulaire", pt: "Fechar formulário", ar: "إغلاق النموذج", sw: "Funga fomu", ha: "Rufe fom", es: "Cerrar formulario" },
  "Close menu": { fr: "Fermer le menu", pt: "Fechar menu", ar: "إغلاق القائمة", sw: "Funga menyu", ha: "Rufe menu", es: "Cerrar menú" },
  "Close View": { fr: "Fermer la vue", pt: "Fechar visualização", ar: "إغلاق العرض", sw: "Funga mwonekano", ha: "Rufe kallo", es: "Cerrar vista" },
  "City": { fr: "Ville", pt: "Cidade", ar: "المدينة", sw: "Jiji", ha: "Gari", es: "Ciudad" },
  "Comment": { fr: "Commentaire", pt: "Comentário", ar: "تعليق", sw: "Maoni", ha: "Sharhi", es: "Comentario" },
  "Comments": { fr: "Commentaires", pt: "Comentários", ar: "التعليقات", sw: "Maoni", ha: "Sharhi", es: "Comentarios" },
  "Company": { fr: "Entreprise", pt: "Empresa", ar: "الشركة", sw: "Kampuni", ha: "Kamfani", es: "Empresa" },
  "Completed": { fr: "Terminé", pt: "Concluído", ar: "مكتمل", sw: "Imekamilika", ha: "An kammala", es: "Completado" },
  "Confirm password": { fr: "Confirmer le mot de passe", pt: "Confirmar senha", ar: "تأكيد كلمة المرور", sw: "Thibitisha nenosiri", ha: "Tabbatar da kalmar sirri", es: "Confirmar contraseña" },
  "Contact": { fr: "Contact", pt: "Contato", ar: "جهة اتصال", sw: "Mawasiliano", ha: "Lamba", es: "Contacto" },
  "Credentials": { fr: "Identifiants", pt: "Credenciais", ar: "بيانات الاعتماد", sw: "Vitambulisho", ha: "Takardun shaida", es: "Credenciales" },
  "Customer": { fr: "Client", pt: "Cliente", ar: "العميل", sw: "Mteja", ha: "Abokin ciniki", es: "Cliente" },
  "Customers": { fr: "Clients", pt: "Clientes", ar: "العملاء", sw: "Wateja", ha: "Abokan ciniki", es: "Clientes" },
  "Country": { fr: "Pays", pt: "País", ar: "البلد", sw: "Nchi", ha: "Ƙasa", es: "País" },
  "Country Code": { fr: "Code pays", pt: "Código do país", ar: "رمز البلد", sw: "Msimbo wa nchi", ha: "Lambar ƙasa", es: "Código de país" },
  "Create a route": { fr: "Créer un itinéraire", pt: "Criar uma rota", ar: "إنشاء مسار", sw: "Unda njia", ha: "Ƙirƙiri hanya", es: "Crear una ruta" },
  "Create one": { fr: "Créer un compte", pt: "Criar uma conta", ar: "إنشاء حساب", sw: "Fungua akaunti", ha: "Ƙirƙiri ɗaya", es: "Crear una" },
  "Dashboard": { fr: "Tableau de bord", pt: "Painel", ar: "لوحة التحكم", sw: "Dashibodi", ha: "Allon bayanai", es: "Panel" },
  "Date": { fr: "Date", pt: "Data", ar: "التاريخ", sw: "Tarehe", ha: "Kwanan wata", es: "Fecha" },
  "Date & Time": { fr: "Date et heure", pt: "Data e hora", ar: "التاريخ والوقت", sw: "Tarehe na saa", ha: "Kwanan wata da lokaci", es: "Fecha y hora" },
  "Day": { fr: "Jour", pt: "Dia", ar: "اليوم", sw: "Siku", ha: "Rana", es: "Día" },
  "Delete": { fr: "Supprimer", pt: "Excluir", ar: "حذف", sw: "Futa", ha: "Goge", es: "Eliminar" },
  "Delete Pending": { fr: "Suppression en attente", pt: "Exclusão pendente", ar: "الحذف قيد الانتظار", sw: "Ufutaji unasubiri", ha: "Gogewa na jiran aiki", es: "Eliminación pendiente" },
  "Delete Requested": { fr: "Suppression demandée", pt: "Exclusão solicitada", ar: "تم طلب الحذف", sw: "Ombi la kufuta limetumwa", ha: "An nemi gogewa", es: "Eliminación solicitada" },
  "Deletion": { fr: "Suppression", pt: "Exclusão", ar: "الحذف", sw: "Ufutaji", ha: "Gogewa", es: "Eliminación" },
  "Departure": { fr: "Départ", pt: "Partida", ar: "المغادرة", sw: "Kuondoka", ha: "Tashi", es: "Salida" },
  "Departure City": { fr: "Ville de départ", pt: "Cidade de partida", ar: "مدينة المغادرة", sw: "Jiji la kuondoka", ha: "Garin tashi", es: "Ciudad de salida" },
  "Departure Date & Time": { fr: "Date et heure de départ", pt: "Data e hora de partida", ar: "تاريخ ووقت المغادرة", sw: "Tarehe na saa ya kuondoka", ha: "Kwanan wata da lokacin tashi", es: "Fecha y hora de salida" },
  "Departure Time": { fr: "Heure de départ", pt: "Hora de partida", ar: "وقت المغادرة", sw: "Saa ya kuondoka", ha: "Lokacin tashi", es: "Hora de salida" },
  "Destination": { fr: "Destination", pt: "Destino", ar: "الوجهة", sw: "Unakoenda", ha: "Inda za a je", es: "Destino" },
  "Details": { fr: "Détails", pt: "Detalhes", ar: "التفاصيل", sw: "Maelezo", ha: "Cikakkun bayanai", es: "Detalles" },
  "Driver": { fr: "Chauffeur", pt: "Motorista", ar: "السائق", sw: "Dereva", ha: "Direba", es: "Conductor" },
  "Edit User": { fr: "Modifier l'utilisateur", pt: "Editar usuário", ar: "تعديل المستخدم", sw: "Hariri mtumiaji", ha: "Gyara mai amfani", es: "Editar usuario" },
  "Email": { fr: "E-mail", pt: "E-mail", ar: "البريد الإلكتروني", sw: "Barua pepe", ha: "Imel", es: "Correo electrónico" },
  "Email address": { fr: "Adresse e-mail", pt: "Endereço de e-mail", ar: "عنوان البريد الإلكتروني", sw: "Anwani ya barua pepe", ha: "Adireshin imel", es: "Dirección de correo" },
  "Emergency Contact": { fr: "Contact d'urgence", pt: "Contato de emergência", ar: "جهة اتصال للطوارئ", sw: "Mawasiliano ya dharura", ha: "Lambar gaggawa", es: "Contacto de emergencia" },
  "Emergency contact phone": { fr: "Téléphone du contact d'urgence", pt: "Telefone do contato de emergência", ar: "هاتف جهة اتصال الطوارئ", sw: "Simu ya mawasiliano ya dharura", ha: "Wayar lambar gaggawa", es: "Teléfono del contacto de emergencia" },
  "Empty": { fr: "Vide", pt: "Vazio", ar: "فارغ", sw: "Tupu", ha: "Fanko", es: "Vacío" },
  "Enter a suspension reason or comment before continuing:": { fr: "Saisissez une raison ou un commentaire de suspension avant de continuer :", pt: "Informe um motivo ou comentário de suspensão antes de continuar:", ar: "أدخل سبب التعليق أو تعليقًا قبل المتابعة:", sw: "Weka sababu au maoni ya kusimamishwa kabla ya kuendelea:", ha: "Shigar da dalilin dakatarwa ko sharhi kafin ci gaba:", es: "Introduce un motivo o comentario de suspensión antes de continuar:" },
  "Enter your password": { fr: "Saisissez votre mot de passe", pt: "Digite sua senha", ar: "أدخل كلمة المرور", sw: "Weka nenosiri lako", ha: "Shigar da kalmar sirri", es: "Introduce tu contraseña" },
  "Email already registered": { fr: "Cet e-mail est déjà enregistré", pt: "Este e-mail já está registrado", ar: "البريد الإلكتروني مسجل بالفعل", sw: "Barua pepe hii tayari imesajiliwa", ha: "An riga an yi rijistar wannan imel", es: "Este correo ya está registrado" },
  "Email already verified": { fr: "E-mail déjà vérifié", pt: "E-mail já verificado", ar: "تم التحقق من البريد الإلكتروني بالفعل", sw: "Barua pepe tayari imethibitishwa", ha: "An riga an tabbatar da imel", es: "Correo ya verificado" },
  "Failed to load profile": { fr: "Impossible de charger le profil", pt: "Falha ao carregar perfil", ar: "تعذر تحميل الملف الشخصي", sw: "Imeshindwa kupakia wasifu", ha: "An kasa loda bayanin martaba", es: "No se pudo cargar el perfil" },
  "Failed": { fr: "Échec", pt: "Falhou", ar: "فشل", sw: "Imeshindwa", ha: "Ya gaza", es: "Falló" },
  "Feedback": { fr: "Retours", pt: "Feedback", ar: "الملاحظات", sw: "Maoni", ha: "Martani", es: "Comentarios" },
  "Ferry": { fr: "Ferry", pt: "Balsa", ar: "عبّارة", sw: "Feri", ha: "Jirgin ruwa", es: "Ferri" },
  "Fleet": { fr: "Flotte", pt: "Frota", ar: "الأسطول", sw: "Meli/Gari", ha: "Rundunar motoci", es: "Flota" },
  "Fleet Count": { fr: "Nombre de véhicules", pt: "Total da frota", ar: "عدد الأسطول", sw: "Idadi ya magari", ha: "Yawan abin hawa", es: "Cantidad de flota" },
  "Fleet Name": { fr: "Nom du véhicule", pt: "Nome da frota", ar: "اسم الأسطول", sw: "Jina la gari", ha: "Sunan abin hawa", es: "Nombre de flota" },
  "Form": { fr: "Formulaire", pt: "Formulário", ar: "النموذج", sw: "Fomu", ha: "Fom", es: "Formulario" },
  "Forgot?": { fr: "Mot de passe oublié ?", pt: "Esqueceu?", ar: "نسيت؟", sw: "Umesahau?", ha: "Ka manta?", es: "¿Olvidaste?" },
  "Good": { fr: "Bon", pt: "Bom", ar: "جيد", sw: "Nzuri", ha: "Mai kyau", es: "Bueno" },
  "Graph": { fr: "Graphique", pt: "Gráfico", ar: "الرسم البياني", sw: "Grafu", ha: "Jadawali", es: "Gráfico" },
  "History": { fr: "Historique", pt: "Histórico", ar: "السجل", sw: "Historia", ha: "Tarihi", es: "Historial" },
  "Holder": { fr: "Titulaire", pt: "Titular", ar: "صاحب الحساب", sw: "Mmiliki", ha: "Mai riƙe", es: "Titular" },
  "Hub": { fr: "Hub", pt: "Hub", ar: "المركز", sw: "Kituo", ha: "Cibiya", es: "Centro" },
  "Inspect details": { fr: "Inspecter les détails", pt: "Inspecionar detalhes", ar: "فحص التفاصيل", sw: "Kagua maelezo", ha: "Duba bayanai", es: "Inspeccionar detalles" },
  "IP Address": { fr: "Adresse IP", pt: "Endereço IP", ar: "عنوان IP", sw: "Anwani ya IP", ha: "Adireshin IP", es: "Dirección IP" },
  "Loading...": { fr: "Chargement...", pt: "Carregando...", ar: "جارٍ التحميل...", sw: "Inapakia...", ha: "Ana lodawa...", es: "Cargando..." },
  "Loading…": { fr: "Chargement…", pt: "Carregando…", ar: "جارٍ التحميل…", sw: "Inapakia…", ha: "Ana lodawa…", es: "Cargando…" },
  "Loading booking...": { fr: "Chargement de la réservation...", pt: "Carregando reserva...", ar: "جارٍ تحميل الحجز...", sw: "Inapakia uhifadhi...", ha: "Ana loda ajiya...", es: "Cargando reserva..." },
  "Inspector": { fr: "Inspecteur", pt: "Inspetor", ar: "المفتش", sw: "Mkaguzi", ha: "Mai dubawa", es: "Inspector" },
  "Legal": { fr: "Juridique", pt: "Jurídico", ar: "قانوني", sw: "Kisheria", ha: "Na doka", es: "Legal" },
  "Ledger": { fr: "Registre", pt: "Livro-razão", ar: "السجل", sw: "Daftari", ha: "Littafi", es: "Libro mayor" },
  "License": { fr: "Licence", pt: "Licença", ar: "الرخصة", sw: "Leseni", ha: "Lasisi", es: "Licencia" },
  "License Plate Number": { fr: "Numéro d'immatriculation", pt: "Número da placa", ar: "رقم لوحة الترخيص", sw: "Nambari ya usajili", ha: "Lambar farantin lasisi", es: "Número de placa" },
  "Linked": { fr: "Lié", pt: "Vinculado", ar: "مرتبط", sw: "Imeunganishwa", ha: "An haɗa", es: "Vinculado" },
  "Linked Transporter": { fr: "Transporteur lié", pt: "Transportador vinculado", ar: "الناقل المرتبط", sw: "Msafirishaji aliyeunganishwa", ha: "Mai sufuri da aka haɗa", es: "Transportista vinculado" },
  "Live": { fr: "En direct", pt: "Ao vivo", ar: "مباشر", sw: "Moja kwa moja", ha: "Kai tsaye", es: "En vivo" },
  "Management": { fr: "Gestion", pt: "Gestão", ar: "الإدارة", sw: "Usimamizi", ha: "Gudanarwa", es: "Gestión" },
  "Mark this booking as completed?": { fr: "Marquer cette réservation comme terminée ?", pt: "Marcar esta reserva como concluída?", ar: "وضع علامة على هذا الحجز كمكتمل؟", sw: "Weka uhifadhi huu kama umekamilika?", ha: "A nuna wannan ajiya ta kammala?", es: "¿Marcar esta reserva como completada?" },
  "Invalid credentials": { fr: "Identifiants invalides", pt: "Credenciais inválidas", ar: "بيانات الاعتماد غير صالحة", sw: "Vitambulisho si sahihi", ha: "Bayanan shiga ba daidai ba", es: "Credenciales inválidas" },
  "Invalid password": { fr: "Mot de passe invalide", pt: "Senha inválida", ar: "كلمة المرور غير صالحة", sw: "Nenosiri si sahihi", ha: "Kalmar sirri ba daidai ba", es: "Contraseña inválida" },
  "Invalid verification code": { fr: "Code de vérification invalide", pt: "Código de verificação inválido", ar: "رمز التحقق غير صالح", sw: "Msimbo wa uthibitishaji si sahihi", ha: "Lambar tabbatarwa ba daidai ba", es: "Código de verificación inválido" },
  "Member since": { fr: "Membre depuis", pt: "Membro desde", ar: "عضو منذ", sw: "Mwanachama tangu", ha: "Memba tun", es: "Miembro desde" },
  "Menu": { fr: "Menu", pt: "Menu", ar: "القائمة", sw: "Menyu", ha: "Menu", es: "Menú" },
  "Minibus": { fr: "Minibus", pt: "Micro-ônibus", ar: "حافلة صغيرة", sw: "Basi dogo", ha: "Karamin bas", es: "Minibús" },
  "Model": { fr: "Modèle", pt: "Modelo", ar: "الطراز", sw: "Muundo", ha: "Samfuri", es: "Modelo" },
  "Module": { fr: "Module", pt: "Módulo", ar: "الوحدة", sw: "Moduli", ha: "Sashe", es: "Módulo" },
  "Name": { fr: "Nom", pt: "Nome", ar: "الاسم", sw: "Jina", ha: "Suna", es: "Nombre" },
  "New": { fr: "Nouveau", pt: "Novo", ar: "جديد", sw: "Mpya", ha: "Sabo", es: "Nuevo" },
  "New password": { fr: "Nouveau mot de passe", pt: "Nova senha", ar: "كلمة مرور جديدة", sw: "Nenosiri jipya", ha: "Sabuwar kalmar sirri", es: "Nueva contraseña" },
  "No bookings yet": { fr: "Aucune réservation pour le moment", pt: "Ainda não há reservas", ar: "لا توجد حجوزات بعد", sw: "Hakuna uhifadhi bado", ha: "Babu ajiya tukuna", es: "Aún no hay reservas" },
  "No data": { fr: "Aucune donnée", pt: "Sem dados", ar: "لا توجد بيانات", sw: "Hakuna data", ha: "Babu bayanai", es: "Sin datos" },
  "No messages yet. Say hello.": { fr: "Aucun message pour le moment. Dites bonjour.", pt: "Ainda não há mensagens. Diga olá.", ar: "لا توجد رسائل بعد. قل مرحبًا.", sw: "Hakuna ujumbe bado. Sema hujambo.", ha: "Babu saƙonni tukuna. Yi sallama.", es: "Aún no hay mensajes. Saluda." },
  "No active verification code — request a new one": { fr: "Aucun code de vérification actif — demandez-en un nouveau", pt: "Nenhum código de verificação ativo — solicite outro", ar: "لا يوجد رمز تحقق نشط — اطلب رمزًا جديدًا", sw: "Hakuna msimbo wa uthibitishaji hai — omba mpya", ha: "Babu lambar tabbatarwa mai aiki — nemi sabuwa", es: "No hay código de verificación activo — solicita uno nuevo" },
  "Network error: Failed to connect to API": { fr: "Erreur réseau : impossible de se connecter à l'API", pt: "Erro de rede: falha ao conectar à API", ar: "خطأ في الشبكة: تعذر الاتصال بواجهة API", sw: "Hitilafu ya mtandao: imeshindwa kuunganisha API", ha: "Kuskuren hanyar sadarwa: an kasa haɗa API", es: "Error de red: no se pudo conectar con la API" },
  "Notifications": { fr: "Notifications", pt: "Notificações", ar: "الإشعارات", sw: "Arifa", ha: "Sanarwa", es: "Notificaciones" },
  "Okay": { fr: "Correct", pt: "Ok", ar: "جيد", sw: "Sawa", ha: "Lafiya", es: "Correcto" },
  "Open menu": { fr: "Ouvrir le menu", pt: "Abrir menu", ar: "فتح القائمة", sw: "Fungua menyu", ha: "Buɗe menu", es: "Abrir menú" },
  "Operations": { fr: "Opérations", pt: "Operações", ar: "العمليات", sw: "Shughuli", ha: "Ayyuka", es: "Operaciones" },
  "Password": { fr: "Mot de passe", pt: "Senha", ar: "كلمة المرور", sw: "Nenosiri", ha: "Kalmar sirri", es: "Contraseña" },
  "Passwords do not match": { fr: "Les mots de passe ne correspondent pas", pt: "As senhas não coincidem", ar: "كلمتا المرور غير متطابقتين", sw: "Nenosiri hazifanani", ha: "Kalmomin sirri ba su dace ba", es: "Las contraseñas no coinciden" },
  "Payments": { fr: "Paiements", pt: "Pagamentos", ar: "المدفوعات", sw: "Malipo", ha: "Biyan kuɗi", es: "Pagos" },
  "Pending": { fr: "En attente", pt: "Pendente", ar: "قيد الانتظار", sw: "Inasubiri", ha: "Ana jira", es: "Pendiente" },
  "Pending Deletion Request": { fr: "Demande de suppression en attente", pt: "Solicitação de exclusão pendente", ar: "طلب الحذف قيد الانتظار", sw: "Ombi la kufuta linasubiri", ha: "Buƙatar gogewa na jiran aiki", es: "Solicitud de eliminación pendiente" },
  "Payout": { fr: "Paiement sortant", pt: "Pagamento", ar: "الدفع", sw: "Malipo", ha: "Fitar da kuɗi", es: "Pago" },
  "Payouts": { fr: "Paiements sortants", pt: "Pagamentos", ar: "المدفوعات", sw: "Malipo", ha: "Fitar da kuɗi", es: "Pagos" },
  "Phone": { fr: "Téléphone", pt: "Telefone", ar: "الهاتف", sw: "Simu", ha: "Waya", es: "Teléfono" },
  "Phone number": { fr: "Numéro de téléphone", pt: "Número de telefone", ar: "رقم الهاتف", sw: "Nambari ya simu", ha: "Lambar waya", es: "Número de teléfono" },
  "Phone Number": { fr: "Numéro de téléphone", pt: "Número de telefone", ar: "رقم الهاتف", sw: "Nambari ya simu", ha: "Lambar waya", es: "Número de teléfono" },
  "Plate Number": { fr: "Numéro d'immatriculation", pt: "Número da placa", ar: "رقم اللوحة", sw: "Nambari ya usajili", ha: "Lambar faranti", es: "Número de placa" },
  "Posted on": { fr: "Publié le", pt: "Publicado em", ar: "نُشر في", sw: "Ilichapishwa", ha: "An wallafa a", es: "Publicado el" },
  "Profile": { fr: "Profil", pt: "Perfil", ar: "الملف الشخصي", sw: "Wasifu", ha: "Bayanin martaba", es: "Perfil" },
  "Rate Journey": { fr: "Noter le trajet", pt: "Avaliar jornada", ar: "قيّم الرحلة", sw: "Kadiria safari", ha: "Kimanta tafiya", es: "Valorar viaje" },
  "Reject": { fr: "Rejeter", pt: "Rejeitar", ar: "رفض", sw: "Kataa", ha: "Ƙi", es: "Rechazar" },
  "Reject this booking?": { fr: "Rejeter cette réservation ?", pt: "Rejeitar esta reserva?", ar: "رفض هذا الحجز؟", sw: "Kataa uhifadhi huu?", ha: "A ƙi wannan ajiya?", es: "¿Rechazar esta reserva?" },
  "Remembered it?": { fr: "Vous vous en souvenez ?", pt: "Lembrou?", ar: "تذكرتها؟", sw: "Umekumbuka?", ha: "Ka tuna?", es: "¿La recordaste?" },
  "Reason": { fr: "Raison", pt: "Motivo", ar: "السبب", sw: "Sababu", ha: "Dalili", es: "Motivo" },
  "Reason for Deletion": { fr: "Raison de la suppression", pt: "Motivo da exclusão", ar: "سبب الحذف", sw: "Sababu ya kufuta", ha: "Dalilin gogewa", es: "Motivo de eliminación" },
  "Request Deletion": { fr: "Demander la suppression", pt: "Solicitar exclusão", ar: "طلب الحذف", sw: "Omba kufuta", ha: "Nemi gogewa", es: "Solicitar eliminación" },
  "Request": { fr: "Demande", pt: "Solicitação", ar: "طلب", sw: "Ombi", ha: "Buƙata", es: "Solicitud" },
  "Revenue": { fr: "Revenus", pt: "Receita", ar: "الإيرادات", sw: "Mapato", ha: "Kudaden shiga", es: "Ingresos" },
  "Review": { fr: "Avis", pt: "Avaliação", ar: "مراجعة", sw: "Tathmini", ha: "Bita", es: "Reseña" },
  "Reviews": { fr: "Avis", pt: "Avaliações", ar: "المراجعات", sw: "Tathmini", ha: "Bitoci", es: "Reseñas" },
  "Role": { fr: "Rôle", pt: "Função", ar: "الدور", sw: "Jukumu", ha: "Matsayi", es: "Rol" },
  "Route": { fr: "Itinéraire", pt: "Rota", ar: "المسار", sw: "Njia", ha: "Hanya", es: "Ruta" },
  "Routes": { fr: "Itinéraires", pt: "Rotas", ar: "المسارات", sw: "Njia", ha: "Hanyoyi", es: "Rutas" },
  "Save": { fr: "Enregistrer", pt: "Salvar", ar: "حفظ", sw: "Hifadhi", ha: "Ajiye", es: "Guardar" },
  "Search": { fr: "Rechercher", pt: "Pesquisar", ar: "بحث", sw: "Tafuta", ha: "Bincika", es: "Buscar" },
  "Security": { fr: "Sécurité", pt: "Segurança", ar: "الأمان", sw: "Usalama", ha: "Tsaro", es: "Seguridad" },
  "Seats": { fr: "Places", pt: "Assentos", ar: "المقاعد", sw: "Viti", ha: "Kujeru", es: "Asientos" },
  "Settlement": { fr: "Règlement", pt: "Liquidação", ar: "التسوية", sw: "Malipo", ha: "Sulhu", es: "Liquidación" },
  "Settlement Bank Account": { fr: "Compte bancaire de règlement", pt: "Conta bancária de liquidação", ar: "حساب بنك التسوية", sw: "Akaunti ya benki ya malipo", ha: "Asusun bankin sulhu", es: "Cuenta bancaria de liquidación" },
  "Settings": { fr: "Paramètres", pt: "Configurações", ar: "الإعدادات", sw: "Mipangilio", ha: "Saituna", es: "Configuración" },
  "Sign in": { fr: "Se connecter", pt: "Entrar", ar: "تسجيل الدخول", sw: "Ingia", ha: "Shiga", es: "Iniciar sesión" },
  "Sign out": { fr: "Se déconnecter", pt: "Sair", ar: "تسجيل الخروج", sw: "Toka", ha: "Fita", es: "Cerrar sesión" },
  "Signing in…": { fr: "Connexion…", pt: "Entrando…", ar: "جارٍ تسجيل الدخول…", sw: "Inaingia…", ha: "Ana shiga…", es: "Iniciando sesión…" },
  "Star": { fr: "étoile", pt: "estrela", ar: "نجمة", sw: "nyota", ha: "tauraro", es: "estrella" },
  "Stars": { fr: "étoiles", pt: "estrelas", ar: "نجوم", sw: "nyota", ha: "taurari", es: "estrellas" },
  "Status": { fr: "Statut", pt: "Status", ar: "الحالة", sw: "Hali", ha: "Matsayi", es: "Estado" },
  "Stop": { fr: "Arrêt", pt: "Parada", ar: "محطة", sw: "Kituo", ha: "Tasha", es: "Parada" },
  "Strong": { fr: "Fort", pt: "Forte", ar: "قوي", sw: "Imara", ha: "Mai ƙarfi", es: "Fuerte" },
  "Summary": { fr: "Résumé", pt: "Resumo", ar: "الملخص", sw: "Muhtasari", ha: "Taƙaitawa", es: "Resumen" },
  "System": { fr: "Système", pt: "Sistema", ar: "النظام", sw: "Mfumo", ha: "Tsari", es: "Sistema" },
  "Terminal": { fr: "Terminal", pt: "Terminal", ar: "المحطة", sw: "Kituo", ha: "Tasha", es: "Terminal" },
  "Time": { fr: "Heure", pt: "Hora", ar: "الوقت", sw: "Saa", ha: "Lokaci", es: "Hora" },
  "Too short": { fr: "Trop court", pt: "Muito curta", ar: "قصير جدًا", sw: "Fupi sana", ha: "Ya yi gajere", es: "Demasiado corta" },
  "Total": { fr: "Total", pt: "Total", ar: "الإجمالي", sw: "Jumla", ha: "Jimla", es: "Total" },
  "Total Bookings": { fr: "Total des réservations", pt: "Total de reservas", ar: "إجمالي الحجوزات", sw: "Jumla ya uhifadhi", ha: "Jimillar ajiyoyi", es: "Total de reservas" },
  "Train": { fr: "Train", pt: "Trem", ar: "قطار", sw: "Treni", ha: "Jirgin ƙasa", es: "Tren" },
  "Transaction ID": { fr: "ID de transaction", pt: "ID da transação", ar: "معرّف المعاملة", sw: "Kitambulisho cha muamala", ha: "Lambar ma'amala", es: "ID de transacción" },
  "Transport Type": { fr: "Type de transport", pt: "Tipo de transporte", ar: "نوع النقل", sw: "Aina ya usafiri", ha: "Nau'in sufuri", es: "Tipo de transporte" },
  "Transport not found": { fr: "Transport introuvable", pt: "Transporte não encontrado", ar: "لم يتم العثور على النقل", sw: "Usafiri haukupatikana", ha: "Ba a sami sufuri ba", es: "Transporte no encontrado" },
  "Transporter": { fr: "Transporteur", pt: "Transportador", ar: "الناقل", sw: "Msafirishaji", ha: "Mai sufuri", es: "Transportista" },
  "Transporter profile": { fr: "Profil du transporteur", pt: "Perfil do transportador", ar: "ملف الناقل", sw: "Wasifu wa msafirishaji", ha: "Bayanin mai sufuri", es: "Perfil del transportista" },
  "Travelers": { fr: "Voyageurs", pt: "Viajantes", ar: "المسافرون", sw: "Wasafiri", ha: "Matafiya", es: "Viajeros" },
  "Traveler": { fr: "Voyageur", pt: "Viajante", ar: "المسافر", sw: "Msafiri", ha: "Matafiyi", es: "Viajero" },
  "Trip": { fr: "Trajet", pt: "Viagem", ar: "الرحلة", sw: "Safari", ha: "Tafiya", es: "Viaje" },
  "Type a message...": { fr: "Saisir un message...", pt: "Digite uma mensagem...", ar: "اكتب رسالة...", sw: "Andika ujumbe...", ha: "Rubuta saƙo...", es: "Escribe un mensaje..." },
  "Type to search countries…": { fr: "Tapez pour rechercher des pays…", pt: "Digite para pesquisar países…", ar: "اكتب للبحث عن البلدان…", sw: "Andika kutafuta nchi…", ha: "Rubuta don neman ƙasashe…", es: "Escribe para buscar países…" },
  "Type to search currencies…": { fr: "Tapez pour rechercher des devises…", pt: "Digite para pesquisar moedas…", ar: "اكتب للبحث عن العملات…", sw: "Andika kutafuta sarafu…", ha: "Rubuta don neman kuɗaɗe…", es: "Escribe para buscar monedas…" },
  "Upload": { fr: "Téléverser", pt: "Enviar", ar: "رفع", sw: "Pakia", ha: "Loda", es: "Subir" },
  "Upload front, side, back, and interior views of the vehicle.": { fr: "Téléversez les vues avant, latérale, arrière et intérieure du véhicule.", pt: "Envie as vistas frontal, lateral, traseira e interna do veículo.", ar: "ارفع صور الواجهة والجانب والخلف والداخل للمركبة.", sw: "Pakia picha za mbele, upande, nyuma na ndani ya gari.", ha: "Loda hotunan gaba, gefe, baya da ciki na abin hawa.", es: "Sube vistas frontal, lateral, trasera e interior del vehículo." },
  "Upload images": { fr: "Téléverser des images", pt: "Enviar imagens", ar: "رفع الصور", sw: "Pakia picha", ha: "Loda hotuna", es: "Subir imágenes" },
  "User Name": { fr: "Nom d'utilisateur", pt: "Nome do usuário", ar: "اسم المستخدم", sw: "Jina la mtumiaji", ha: "Sunan mai amfani", es: "Nombre de usuario" },
  "Users": { fr: "Utilisateurs", pt: "Usuários", ar: "المستخدمون", sw: "Watumiaji", ha: "Masu amfani", es: "Usuarios" },
  "Van": { fr: "Van", pt: "Van", ar: "فان", sw: "Vani", ha: "Baban mota", es: "Furgoneta" },
  "Vehicle Details": { fr: "Détails du véhicule", pt: "Detalhes do veículo", ar: "تفاصيل المركبة", sw: "Maelezo ya gari", ha: "Bayanan abin hawa", es: "Detalles del vehículo" },
  "Vehicle Name": { fr: "Nom du véhicule", pt: "Nome do veículo", ar: "اسم المركبة", sw: "Jina la gari", ha: "Sunan abin hawa", es: "Nombre del vehículo" },
  "Vehicle not found": { fr: "Véhicule introuvable", pt: "Veículo não encontrado", ar: "المركبة غير موجودة", sw: "Gari halikupatikana", ha: "Ba a sami abin hawa ba", es: "Vehículo no encontrado" },
  "Vehicle Photos (Upload up to 5)": { fr: "Photos du véhicule (jusqu'à 5)", pt: "Fotos do veículo (envie até 5)", ar: "صور المركبة (حتى 5)", sw: "Picha za gari (pakia hadi 5)", ha: "Hotunan abin hawa (loda har 5)", es: "Fotos del vehículo (sube hasta 5)" },
  "Vehicles": { fr: "Véhicules", pt: "Veículos", ar: "المركبات", sw: "Magari", ha: "Ababen hawa", es: "Vehículos" },
  "Verified": { fr: "Vérifié", pt: "Verificado", ar: "تم التحقق", sw: "Imethibitishwa", ha: "An tabbatar", es: "Verificado" },
  "Weak": { fr: "Faible", pt: "Fraca", ar: "ضعيف", sw: "Dhaifu", ha: "Mai rauni", es: "Débil" },
  "Welcome back.": { fr: "Bon retour.", pt: "Bem-vindo de volta.", ar: "مرحبًا بعودتك.", sw: "Karibu tena.", ha: "Barka da dawowa.", es: "Bienvenido de nuevo." },
  "you@example.com": { fr: "vous@exemple.com", pt: "voce@exemplo.com", ar: "you@example.com", sw: "wewe@example.com", ha: "kai@example.com", es: "tu@ejemplo.com" },
};

Object.assign(exactPhrases, extraPhrases);

const countryNameToRegion = new Map<string, string>([
  ["algeria", "DZ"], ["angola", "AO"], ["austria", "AT"], ["benin", "BJ"], ["botswana", "BW"],
  ["burkina faso", "BF"], ["burundi", "BI"], ["cabo verde", "CV"], ["cameroon", "CM"],
  ["central african republic", "CF"], ["chad", "TD"], ["comoros", "KM"], ["congo", "CG"],
  ["congo (drc)", "CD"], ["côte d'ivoire", "CI"], ["djibouti", "DJ"], ["egypt", "EG"],
  ["equatorial guinea", "GQ"], ["eritrea", "ER"], ["eswatini", "SZ"], ["ethiopia", "ET"],
  ["gabon", "GA"], ["gambia", "GM"], ["ghana", "GH"], ["guinea", "GN"], ["guinea-bissau", "GW"],
  ["india", "IN"], ["kenya", "KE"], ["lesotho", "LS"], ["liberia", "LR"], ["libya", "LY"],
  ["madagascar", "MG"], ["malawi", "MW"], ["mali", "ML"], ["mauritania", "MR"], ["mauritius", "MU"],
  ["morocco", "MA"], ["mozambique", "MZ"], ["namibia", "NA"], ["niger", "NE"], ["nigeria", "NG"],
  ["pakistan", "PK"], ["rwanda", "RW"], ["são tomé and príncipe", "ST"], ["senegal", "SN"],
  ["seychelles", "SC"], ["sierra leone", "SL"], ["somalia", "SO"], ["south africa", "ZA"],
  ["south sudan", "SS"], ["sudan", "SD"], ["tanzania", "TZ"], ["togo", "TG"], ["tunisia", "TN"],
  ["uganda", "UG"], ["united arab emirates", "AE"], ["united kingdom", "GB"], ["united states", "US"],
  ["zambia", "ZM"], ["zimbabwe", "ZW"],
]);

const segmentSourcesByLocale: Partial<Record<Exclude<Locale, "en">, string[]>> = {};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function makeDictionaryReverseMaps(dictionaries: DictionaryBundle) {
  const maps: Partial<Record<Locale, Map<string, string>>> = {};
  const english = dictionaries.en ?? {};

  for (const locale of locales) {
    if (locale.code === "en") continue;
    const dict = dictionaries[locale.code];
    if (!dict) continue;

    const map = new Map<string, string>();
    for (const [key, englishValue] of Object.entries(english)) {
      const translated = dict[key];
      if (englishValue && translated) map.set(normalizeText(englishValue), translated);
    }
    maps[locale.code] = map;
  }

  return maps;
}

function translateCountryName(text: string, locale: Locale) {
  const region = countryNameToRegion.get(text.toLowerCase());
  if (!region) return null;

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    return displayNames.of(region) ?? null;
  } catch {
    return null;
  }
}

function translateCurrencyName(text: string, locale: Locale) {
  const match = text.match(/^(.+?)\s+\(([A-Z]{3})\)$/);
  if (!match) return null;

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "currency" });
    const translated = displayNames.of(match[2]);
    return translated ? `${translated} (${match[2]})` : null;
  } catch {
    return null;
  }
}

function translateStars(text: string, locale: Locale, translateBase: (text: string) => string) {
  const match = text.match(/^(\d+)\s+Stars?$/);
  if (!match) return null;
  const count = match[1];
  const star = translateBase(Number(count) === 1 ? "Star" : "Stars");
  return `${count} ${star}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function translateBySegments(text: string, locale: Locale) {
  if (locale === "en" || text.length < 4 || !/[A-Za-z]/.test(text)) return null;

  let result = text;
  const cacheKey = locale as Exclude<Locale, "en">;
  const segmentSources = segmentSourcesByLocale[cacheKey] ??= Object.keys(exactPhrases)
      .filter((source) => {
        if (source.includes("@") || source.includes("?") || source.includes("…")) return false;
        if (source.length < 4 && !["Bus", "Car", "Van"].includes(source)) return false;
        return Boolean(exactPhrases[source]?.[locale]);
      })
      .sort((a, b) => b.length - a.length);

  for (const source of segmentSources) {
    const translated = exactPhrases[source]?.[locale];
    if (!translated) continue;

    const pattern = new RegExp(`(^|[^A-Za-z0-9])(${escapeRegExp(source)})(?=$|[^A-Za-z0-9])`, "gi");
    result = result.replace(pattern, (_match, prefix) => `${prefix}${translated}`);
  }

  return result !== text ? result : null;
}

export function createTextTranslator(locale: Locale, dictionaries: DictionaryBundle = {}) {
  const reverseMaps = makeDictionaryReverseMaps(dictionaries);
  const exact = locale === "en" ? null : exactPhrases;

  const translateBase = (source: string): string => {
    if (locale === "en") return source;

    const normalized = normalizeText(source);
    if (!normalized) return source;

    const fromDictionary = reverseMaps[locale]?.get(normalized);
    if (fromDictionary) return fromDictionary;

    const fromRuntime = exact?.[normalized]?.[locale];
    if (fromRuntime) return fromRuntime;

    const country = translateCountryName(normalized, locale);
    if (country) return country;

    const currency = translateCurrencyName(normalized, locale);
    if (currency) return currency;

    if (normalized.endsWith(":")) {
      const base = normalized.slice(0, -1);
      const translated = translateBase(base);
      if (translated !== base) return `${translated}:`;
    }

    const withArrow = normalized.match(/^([←→])\s*(.+)$/);
    if (withArrow) {
      const translated = translateBase(withArrow[2]);
      if (translated !== withArrow[2]) return `${withArrow[1]} ${translated}`;
    }

    const starText = translateStars(normalized, locale, translateBase);
    if (starText) return starText;

    const segmentText = translateBySegments(normalized, locale);
    if (segmentText) return segmentText;

    return source;
  };

  return (source: string): string => {
    if (locale === "en") return source;

    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    const inner = source.slice(leading.length, source.length - trailing.length);
    const translated = translateBase(inner);
    return `${leading}${translated}${trailing}`;
  };
}

export function LocaleProvider({
  children,
  dictionaries = {},
  storageKey = defaultStorageKey,
}: {
  children: React.ReactNode;
  dictionaries?: DictionaryBundle;
  storageKey?: string;
}) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (isLocale(stored)) setLocaleState(stored);
    } catch {
     }
  }, [storageKey]);

  useEffect(() => {
    const selected = locales.find((item) => item.code === locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = selected?.rtl ? "rtl" : "ltr";
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try {
      localStorage.setItem(storageKey, nextLocale);
    } catch {
     }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [storageKey]);

  const translateText = useMemo(() => createTextTranslator(locale, dictionaries), [locale, dictionaries]);

  const value = useMemo<LocaleContextValue>(() => {
    const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE] ?? {};
    const fallback = dictionaries[DEFAULT_LOCALE] ?? {};

    const t = (key: string, fallbackText?: string) => dict[key] ?? fallback[key] ?? fallbackText ?? key;
    return { locale, setLocale, t, translateText };
  }, [dictionaries, locale, setLocale, translateText]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}

export function useT() {
  return useLocale().t;
}

const textNodeOriginals = new WeakMap<Text, string>();
const localizedAttributes = ["placeholder", "aria-label", "title", "alt"] as const;

function shouldSkipNode(node: Node) {
  const element = node.nodeType === Node.ELEMENT_NODE
    ? node as Element
    : node.parentElement;

  if (!element) return true;
  return Boolean(element.closest("script, style, noscript, code, pre, svg, [data-no-localize], [translate='no']"));
}

function applyTextNode(textNode: Text, translateText: (text: string) => string, locale: Locale) {
  if (shouldSkipNode(textNode)) return;

  const original = textNodeOriginals.get(textNode) ?? textNode.nodeValue ?? "";
  if (!textNodeOriginals.has(textNode)) textNodeOriginals.set(textNode, original);

  const translated = locale === "en" ? original : translateText(original);
  if (textNode.nodeValue !== translated) textNode.nodeValue = translated;
}

function applyElementAttributes(element: Element, translateText: (text: string) => string, locale: Locale) {
  if (shouldSkipNode(element)) return;

  for (const attr of localizedAttributes) {
    const value = element.getAttribute(attr);
    if (!value) continue;

    const originalAttr = `data-i18n-original-${attr}`;
    const original = element.getAttribute(originalAttr) ?? value;
    if (!element.hasAttribute(originalAttr)) element.setAttribute(originalAttr, original);

    const translated = locale === "en" ? original : translateText(original);
    if (value !== translated) element.setAttribute(attr, translated);
  }

  if (element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type)) {
    const value = element.getAttribute("value");
    if (!value) return;

    const originalAttr = "data-i18n-original-value";
    const original = element.getAttribute(originalAttr) ?? value;
    if (!element.hasAttribute(originalAttr)) element.setAttribute(originalAttr, original);

    const translated = locale === "en" ? original : translateText(original);
    if (value !== translated) element.setAttribute("value", translated);
  }
}

function localizeNode(root: Node, translateText: (text: string) => string, locale: Locale) {
  if (root.nodeType === Node.TEXT_NODE) {
    applyTextNode(root as Text, translateText, locale);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  if (root.nodeType === Node.ELEMENT_NODE) {
    const element = root as Element;
    if (element.tagName && ["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG"].includes(element.tagName)) return;
    if (element.hasAttribute && (element.hasAttribute("data-no-localize") || element.getAttribute("translate") === "no")) return;

    applyElementAttributes(element, translateText, locale);
  }

  let child = root.firstChild;
  while (child) {
    localizeNode(child, translateText, locale);
    child = child.nextSibling;
  }
}

export function RuntimeLocalizer() {
  const { locale, translateText } = useLocale();
  const applyingRef = useRef(false);

  useEffect(() => {
    const apply = () => {
      if (!document.body) return;
      applyingRef.current = true;
      localizeNode(document.body, translateText, locale);
      applyingRef.current = false;
    };

    apply();

    const observer = new MutationObserver((mutations) => {
      if (applyingRef.current) return;

      applyingRef.current = true;
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const textNode = mutation.target as Text;
          const currentVal = textNode.nodeValue ?? "";
          const storedOriginal = textNodeOriginals.get(textNode);
          
          if (storedOriginal !== undefined) {
            const expectedTranslated = locale === "en" ? storedOriginal : translateText(storedOriginal);
            if (currentVal !== expectedTranslated) {
              textNodeOriginals.set(textNode, currentVal);
            }
          } else {
            textNodeOriginals.set(textNode, currentVal);
          }

          applyTextNode(textNode, translateText, locale);
        } else if (mutation.type === "attributes") {
          const element = mutation.target as Element;
          const attr = mutation.attributeName;
          if (attr && localizedAttributes.includes(attr as any)) {
            const currentVal = element.getAttribute(attr) ?? "";
            const originalAttr = `data-i18n-original-${attr}`;
            const storedOriginal = element.getAttribute(originalAttr);
            
            if (storedOriginal !== null) {
              const expectedTranslated = locale === "en" ? storedOriginal : translateText(storedOriginal);
              if (currentVal !== expectedTranslated) {
                element.setAttribute(originalAttr, currentVal);
              }
            } else {
              element.setAttribute(originalAttr, currentVal);
            }
          }
          
          if (element instanceof HTMLInputElement && ["button", "submit", "reset"].includes(element.type)) {
            const currentVal = element.getAttribute("value") ?? "";
            const originalAttr = "data-i18n-original-value";
            const storedOriginal = element.getAttribute(originalAttr);
            
            if (storedOriginal !== null) {
              const expectedTranslated = locale === "en" ? storedOriginal : translateText(storedOriginal);
              if (currentVal !== expectedTranslated) {
                element.setAttribute(originalAttr, currentVal);
              }
            } else {
              element.setAttribute(originalAttr, currentVal);
            }
          }

          applyElementAttributes(element, translateText, locale);
        } else {
          for (const node of Array.from(mutation.addedNodes)) {
            localizeNode(node, translateText, locale);
          }
        }
      }
      applyingRef.current = false;
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...localizedAttributes],
    });

    return () => observer.disconnect();
  }, [locale, translateText]);

  useEffect(() => {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    const originalPrompt = window.prompt;

    window.alert = (message?: unknown) => originalAlert.call(window, typeof message === "string" ? translateText(message) : message);
    window.confirm = (message?: string) => originalConfirm.call(window, message ? translateText(message) : message);
    window.prompt = (message?: string, defaultValue?: string) => originalPrompt.call(window, message ? translateText(message) : message, defaultValue);

    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      window.prompt = originalPrompt;
    };
  }, [translateText]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      if (!headers.has("Accept-Language")) {
        headers.set("Accept-Language", locale);
      }

      if (input instanceof Request) {
        return originalFetch(new Request(input, { ...init, headers }));
      }

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [locale]);

  return null;
}

export function LanguageSwitcher({
  floating = false,
  floatingPosition = "bottom-right",
  hideOnPaths = [],
  menuPlacement,
}: {
  floating?: boolean;
  floatingPosition?: "bottom-right" | "top-left" | "top-right" | "top-start" | "top-end";
  hideOnPaths?: string[];
  menuPlacement?: "up" | "down";
}) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState("");
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const selected = locales.find((item) => item.code === locale) ?? locales[0];
  const placement = menuPlacement ?? (floating && floatingPosition === "bottom-right" ? "up" : "down");
  const isRtl = Boolean(selected?.rtl);
  const topStartClass = isRtl
    ? "fixed right-4 top-4 z-[100] pointer-events-auto"
    : "fixed left-4 top-4 z-[100] pointer-events-auto";
  const topEndClass = isRtl
    ? "fixed left-4 top-4 z-[100] pointer-events-auto"
    : "fixed right-4 top-4 z-[100] pointer-events-auto";
  const floatingClass = floatingPosition === "top-start"
    ? topStartClass
    : floatingPosition === "top-end"
    ? topEndClass
    : floatingPosition === "top-left"
    ? "fixed left-4 top-4 z-[100] pointer-events-auto"
    : floatingPosition === "top-right"
    ? "fixed right-4 top-4 z-[100] pointer-events-auto"
    : "fixed bottom-4 right-4 z-[100] pointer-events-auto";
  const menuAlignmentClass = floatingPosition === "top-start"
    ? isRtl ? "right-0" : "left-0"
    : floatingPosition === "top-end"
    ? isRtl ? "left-0" : "right-0"
    : floatingPosition === "top-left" ? "left-0" : "right-0";

  const closeMenu = useCallback(() => {
    setOpen(false);
    if (detailsRef.current) detailsRef.current.open = false;
  }, []);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  if (hideOnPaths.includes(pathname)) return null;

  return (
    <details
      ref={detailsRef}
      data-no-localize
      className={`${floating ? floatingClass : "relative"} group`}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        onKeyDown={(event) => {
          if (event.key === "Escape") closeMenu();
        }}
        className="flex h-11 cursor-pointer list-none items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-700 shadow-[0_16px_32px_-18px_rgba(15,23,42,0.48),0_1px_2px_rgba(15,23,42,0.08)] backdrop-blur transition hover:border-slate-300 hover:text-zinc-950 [&::-webkit-details-marker]:hidden"
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
        </svg>
        <span>{selected.nativeLabel}</span>
      </summary>

      <div
        role="listbox"
        className={`absolute ${menuAlignmentClass} z-[110] w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/12 ${
          placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
        }`}
      >
        {locales.map((item) => (
          <button
            key={item.code}
            type="button"
            role="option"
            aria-selected={item.code === locale}
            onClick={() => {
              setLocale(item.code);
              closeMenu();
            }}
            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
              item.code === locale
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-zinc-950"
            }`}
          >
            <span>
              <span className="block font-semibold">{item.nativeLabel}</span>
              <span className="block text-[11px] text-slate-400">{item.label}</span>
            </span>
            {item.code === locale && <span className="text-emerald-600">✓</span>}
          </button>
        ))}
      </div>
    </details>
  );
}
