// Tvåfaktorsautentisering (TOTP) via en autentiseringsapp (Google Authenticator, Authy m.fl.)
// Kräver att Multi-factor authentication är påslaget i Firebase Console (Authentication →
// Sign-in method → Advanced → Multi-factor authentication).
import {
  multiFactor,
  TotpMultiFactorGenerator,
  getMultiFactorResolver,
} from "firebase/auth";
import QRCode from "qrcode";
import { auth } from "./config";

export async function startaTotpRegistrering(user) {
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const qrUrl = secret.generateQrCodeUrl(user.email, "Synappsen");
  const qrDataUrl = await QRCode.toDataURL(qrUrl);
  return { secret, qrDataUrl, delningsnyckel: secret.secretKey };
}

export async function slutforTotpRegistrering(user, secret, kod, visningsnamn = "Autentiseringsapp") {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, kod);
  await multiFactor(user).enroll(assertion, visningsnamn);
}

export async function taBortTotp(user, faktorUid) {
  await multiFactor(user).unenroll(faktorUid);
}

export function hamtaInskrivnaFaktorer(user) {
  return multiFactor(user).enrolledFactors;
}

export function hamtaMfaResolver(fel) {
  return getMultiFactorResolver(auth, fel);
}

export async function slutforMfaInloggning(resolver, kod) {
  const faktor = resolver.hints[0];
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(faktor.uid, kod);
  return resolver.resolveSignIn(assertion);
}
