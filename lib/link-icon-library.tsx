import type { ComponentType } from 'react';
import {
  ShoppingBag, ShoppingCart, Store, Tag, Gift, CreditCard, Package, Truck, Percent,
  Phone, Mail, MessageCircle, MessageSquare, Send, Calendar, CalendarCheck, CalendarDays, Clock,
  Globe, Link, ExternalLink, Download, FileText, BookOpen, Newspaper, Rss, Info, HelpCircle,
  Play, Video, Camera, Image, Mic, Music, Radio, Podcast, Film, Headphones,
  GraduationCap, Lightbulb, Pencil, PenTool, Award, Trophy, Target,
  Utensils, Coffee, Pizza, Cake, Wine, Beer, ChefHat, Sandwich, IceCream,
  Heart, HeartPulse, Stethoscope, Dumbbell, Scissors, Sparkles, Flower2, Smile, Brush,
  Briefcase, Building2, BarChart3, TrendingUp, DollarSign, Wallet, Handshake, Users, User, Calculator,
  MapPin, Map, Navigation, Car, Plane, Home, Hotel, Bike, Church,
  Star, Zap, Flame, Rocket, Crown, Gem, Bell, Megaphone, Ticket, Gamepad2, Palette, Code, Laptop,
  Smartphone, Shield, Leaf, Sun, PawPrint, Dog, Baby, Shirt,
} from 'lucide-react';
import {
  IconInstagram, IconTiktok, IconYoutube, IconXTwitter, IconFacebook, IconLinkedin, IconGithub,
  IconThreads, IconPinterest, IconSpotify, IconSoundcloud, IconTwitch, IconDiscord, IconWhatsapp, IconTelegram,
} from '@/lib/social-icons';

// Biblioteca de ícones para os botões de link. O link guarda `icon_source = 'library'` e `icon = 'lib:<chave>'`;
// o tema desenha o ícone com currentColor, então ele acompanha as cores de cada tema.

export const LIB_PREFIX = 'lib:';

type IconComp = ComponentType<{ className?: string }>;
export type LibraryIcon = { key: string; label: string; category: string; Icon: IconComp };

const C = {
  compras: 'Compras',
  contato: 'Contato e agenda',
  conteudo: 'Conteúdo',
  midia: 'Mídia',
  educacao: 'Educação',
  comida: 'Comida',
  saude: 'Saúde e beleza',
  negocios: 'Negócios',
  lugares: 'Lugares',
  redes: 'Redes sociais',
  outros: 'Outros',
};

const ICONS: [string, string, string, IconComp][] = [
  ['shopping-bag', 'Sacola', C.compras, ShoppingBag], ['shopping-cart', 'Carrinho', C.compras, ShoppingCart], ['store', 'Loja', C.compras, Store],
  ['tag', 'Etiqueta', C.compras, Tag], ['percent', 'Desconto', C.compras, Percent], ['gift', 'Presente', C.compras, Gift],
  ['credit-card', 'Cartão', C.compras, CreditCard], ['package', 'Pacote', C.compras, Package], ['truck', 'Entrega', C.compras, Truck],

  ['phone', 'Telefone', C.contato, Phone], ['mail', 'E-mail', C.contato, Mail], ['message-circle', 'Mensagem', C.contato, MessageCircle],
  ['message-square', 'Chat', C.contato, MessageSquare], ['send', 'Enviar', C.contato, Send], ['calendar', 'Calendário', C.contato, Calendar],
  ['calendar-check', 'Agendar', C.contato, CalendarCheck], ['calendar-days', 'Agenda', C.contato, CalendarDays], ['clock', 'Horário', C.contato, Clock],

  ['globe', 'Site', C.conteudo, Globe], ['link', 'Link', C.conteudo, Link], ['external-link', 'Abrir', C.conteudo, ExternalLink],
  ['download', 'Download', C.conteudo, Download], ['file-text', 'Documento', C.conteudo, FileText], ['book-open', 'Livro', C.conteudo, BookOpen],
  ['newspaper', 'Notícias', C.conteudo, Newspaper], ['rss', 'Blog', C.conteudo, Rss], ['info', 'Informações', C.conteudo, Info],
  ['help-circle', 'Dúvidas', C.conteudo, HelpCircle],

  ['play', 'Play', C.midia, Play], ['video', 'Vídeo', C.midia, Video], ['camera', 'Câmera', C.midia, Camera],
  ['image', 'Imagem', C.midia, Image], ['mic', 'Microfone', C.midia, Mic], ['music', 'Música', C.midia, Music],
  ['headphones', 'Fones', C.midia, Headphones], ['radio', 'Rádio', C.midia, Radio], ['podcast', 'Podcast', C.midia, Podcast],
  ['film', 'Filme', C.midia, Film],

  ['graduation-cap', 'Curso', C.educacao, GraduationCap], ['lightbulb', 'Ideia', C.educacao, Lightbulb], ['pencil', 'Lápis', C.educacao, Pencil],
  ['pen-tool', 'Design', C.educacao, PenTool], ['award', 'Certificado', C.educacao, Award], ['trophy', 'Troféu', C.educacao, Trophy],
  ['target', 'Meta', C.educacao, Target],

  ['utensils', 'Restaurante', C.comida, Utensils], ['chef-hat', 'Chef', C.comida, ChefHat], ['coffee', 'Café', C.comida, Coffee],
  ['pizza', 'Pizza', C.comida, Pizza], ['sandwich', 'Lanche', C.comida, Sandwich], ['cake', 'Bolo', C.comida, Cake],
  ['ice-cream', 'Sorvete', C.comida, IceCream], ['wine', 'Vinho', C.comida, Wine], ['beer', 'Cerveja', C.comida, Beer],

  ['heart', 'Coração', C.saude, Heart], ['heart-pulse', 'Saúde', C.saude, HeartPulse], ['stethoscope', 'Consulta', C.saude, Stethoscope],
  ['dumbbell', 'Academia', C.saude, Dumbbell], ['scissors', 'Salão', C.saude, Scissors], ['brush', 'Maquiagem', C.saude, Brush],
  ['sparkles', 'Brilho', C.saude, Sparkles], ['flower', 'Flor', C.saude, Flower2], ['smile', 'Sorriso', C.saude, Smile],

  ['briefcase', 'Trabalho', C.negocios, Briefcase], ['building', 'Empresa', C.negocios, Building2], ['handshake', 'Parceria', C.negocios, Handshake],
  ['bar-chart', 'Resultados', C.negocios, BarChart3], ['trending-up', 'Crescimento', C.negocios, TrendingUp], ['dollar', 'Dinheiro', C.negocios, DollarSign],
  ['wallet', 'Carteira', C.negocios, Wallet], ['calculator', 'Calculadora', C.negocios, Calculator], ['users', 'Equipe', C.negocios, Users],
  ['user', 'Perfil', C.negocios, User],

  ['map-pin', 'Localização', C.lugares, MapPin], ['map', 'Mapa', C.lugares, Map], ['navigation', 'Rota', C.lugares, Navigation],
  ['home', 'Casa', C.lugares, Home], ['hotel', 'Hotel', C.lugares, Hotel], ['car', 'Carro', C.lugares, Car],
  ['bike', 'Bicicleta', C.lugares, Bike], ['plane', 'Viagem', C.lugares, Plane], ['church', 'Igreja', C.lugares, Church],

  ['instagram', 'Instagram', C.redes, IconInstagram], ['tiktok', 'TikTok', C.redes, IconTiktok], ['youtube', 'YouTube', C.redes, IconYoutube],
  ['whatsapp', 'WhatsApp', C.redes, IconWhatsapp], ['telegram', 'Telegram', C.redes, IconTelegram], ['x', 'X (Twitter)', C.redes, IconXTwitter],
  ['facebook', 'Facebook', C.redes, IconFacebook], ['linkedin', 'LinkedIn', C.redes, IconLinkedin], ['threads', 'Threads', C.redes, IconThreads],
  ['pinterest', 'Pinterest', C.redes, IconPinterest], ['spotify', 'Spotify', C.redes, IconSpotify], ['soundcloud', 'SoundCloud', C.redes, IconSoundcloud],
  ['twitch', 'Twitch', C.redes, IconTwitch], ['discord', 'Discord', C.redes, IconDiscord], ['github', 'GitHub', C.redes, IconGithub],

  ['star', 'Estrela', C.outros, Star], ['zap', 'Raio', C.outros, Zap], ['flame', 'Fogo', C.outros, Flame],
  ['rocket', 'Foguete', C.outros, Rocket], ['crown', 'Coroa', C.outros, Crown], ['gem', 'Joia', C.outros, Gem],
  ['bell', 'Sino', C.outros, Bell], ['megaphone', 'Anúncio', C.outros, Megaphone], ['ticket', 'Ingresso', C.outros, Ticket],
  ['gamepad', 'Games', C.outros, Gamepad2], ['palette', 'Arte', C.outros, Palette], ['code', 'Código', C.outros, Code],
  ['laptop', 'Notebook', C.outros, Laptop], ['smartphone', 'Celular', C.outros, Smartphone], ['shield', 'Segurança', C.outros, Shield],
  ['leaf', 'Natureza', C.outros, Leaf], ['sun', 'Sol', C.outros, Sun], ['paw', 'Pet', C.outros, PawPrint],
  ['dog', 'Cachorro', C.outros, Dog], ['baby', 'Bebê', C.outros, Baby], ['shirt', 'Roupa', C.outros, Shirt],
];

export const ICON_LIBRARY: LibraryIcon[] = ICONS.map(([key, label, category, Icon]) => ({ key, label, category, Icon }));
export const ICON_CATEGORIES = Object.values(C);
const BY_KEY: Record<string, LibraryIcon> = Object.fromEntries(ICON_LIBRARY.map(i => [i.key, i]));

export function libraryIconValue(key: string) {
  return LIB_PREFIX + key;
}

// Ícone da biblioteca a partir do valor salvo no link ('lib:<chave>'); null se não for da biblioteca
export function getLibraryIcon(icon: string | null | undefined): LibraryIcon | null {
  if (!icon || !icon.startsWith(LIB_PREFIX)) return null;
  return BY_KEY[icon.slice(LIB_PREFIX.length)] || null;
}
