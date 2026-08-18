// Maps Clerk's `appearance` API onto client/src/styles/tokens.css — DESIGN.md §10.1
// ("no component ever writes a hex") applies here too: every value below is a
// token reference, not a literal. See DESIGN.md §2.3 for what each surface means.

export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'iconButton',
  },
  variables: {
    colorPrimary: 'var(--color-accent-solid)',
    colorBackground: 'var(--color-surface)',
    colorInputBackground: 'var(--color-surface-sunken)',
    colorInputText: 'var(--color-ink)',
    colorText: 'var(--color-ink)',
    colorTextSecondary: 'var(--color-ink-2)',
    colorDanger: 'var(--color-danger)',
    colorSuccess: 'var(--color-completed)',
    colorNeutral: 'var(--color-ink-3)',
    colorShimmer: 'var(--color-surface-sunken)',
    fontFamily: 'var(--font-sans)',
    fontFamilyButtons: 'var(--font-sans)',
    borderRadius: 'var(--radius-md)',
    spacingUnit: '1rem',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full shadow-none bg-transparent',
    card: 'w-full gap-6 rounded-(--radius-xl) border border-(--border-hairline) bg-surface p-6 shadow-none',
    header: 'gap-1.5',
    headerTitle: 'font-serif text-title text-ink',
    headerSubtitle: 'text-body text-ink-2',
    logoBox: 'hidden',
    socialButtonsBlockButton:
      'h-11 rounded-(--radius-md) border border-(--border-strong) bg-surface-sunken text-ink text-body hover:bg-surface-sunken/80 transition-colors',
    socialButtonsBlockButtonText: 'text-body text-ink',
    dividerRow: 'my-2',
    dividerLine: 'bg-(--border-strong)',
    dividerText: 'text-meta text-ink-3',
    formFieldLabel: 'text-meta text-ink-2 font-medium',
    formFieldInput:
      'h-11 rounded-(--radius-md) border border-(--border-strong) bg-surface-sunken text-ink placeholder:text-ink-3 focus:border-pine',
    formFieldInputShowPasswordButton: 'text-ink-3 hover:text-ink',
    formFieldHintText: 'text-meta text-ink-3',
    formFieldErrorText: 'text-meta text-danger',
    formFieldSuccessText: 'text-meta text-completed',
    formButtonPrimary:
      'h-(--size-tap-min) rounded-(--radius-md) bg-accent-solid text-canvas text-body font-medium normal-case shadow-none hover:bg-accent-press transition-colors',
    footerActionText: 'text-body text-ink-2',
    footerActionLink: 'text-body text-accent hover:text-accent-solid font-medium',
    identityPreview: 'rounded-(--radius-md) border border-(--border-strong) bg-surface-sunken',
    identityPreviewText: 'text-body text-ink',
    identityPreviewEditButton: 'text-accent',
    otpCodeFieldInput: 'border-(--border-strong) bg-surface-sunken text-ink',
    formResendCodeLink: 'text-accent',
    alternativeMethodsBlockButton: 'text-body text-ink hover:bg-surface-sunken',
    badge: 'bg-pine-tint text-pine border-none',
    avatarBox: 'ring-2 ring-(--border-strong)',
    userButtonPopoverCard: 'bg-surface border border-(--border-hairline)',
    userButtonPopoverActionButtonText: 'text-ink',
    userButtonPopoverFooter: 'hidden',
    footer: 'bg-transparent',
  },
};
