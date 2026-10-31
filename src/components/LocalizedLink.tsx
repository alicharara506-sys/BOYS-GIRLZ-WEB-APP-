import { forwardRef, useCallback } from "react";
import { Link as RouterLink, NavLink as RouterNavLink, useNavigate as useRouterNavigate, type LinkProps, type NavLinkProps, type NavigateFunction, type NavigateOptions, type To } from "react-router";
import { useLocale } from "../i18n/Locale";
import { localizeTo } from "../config/locale-url";

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...props }, ref) {
  const { language } = useLocale();
  return <RouterLink {...props} to={localizeTo(to, language)} ref={ref} />;
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({ to, ...props }, ref) {
  const { language } = useLocale();
  return <RouterNavLink {...props} to={localizeTo(to, language)} ref={ref} />;
});

export function useNavigate(): NavigateFunction {
  const navigate = useRouterNavigate();
  const { language } = useLocale();
  return useCallback(((to: To | number, options?: NavigateOptions) => {
    if (typeof to === "number") return navigate(to);
    return navigate(localizeTo(to, language), options);
  }) as NavigateFunction, [navigate, language]);
}
