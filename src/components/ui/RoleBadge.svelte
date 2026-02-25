<script lang="ts">
  let { role }: { role: string } = $props()
</script>

<span class="role-badge role-badge--{role}">
  {role}
</span>

<style>
  .role-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.6rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
    width: fit-content;
  }

  .role-badge--student {
    background-color: var(--role-student-background-color);
    color: var(--role-student-text-color);
  }

  .role-badge--docente {
    background-color: var(--role-docente-background-color);
    color: var(--role-docente-text-color);
  }

  .role-badge--admin {
    background-color: var(--role-admin-background-color);
    color: var(--role-admin-text-color);
  }

  .role-badge--sudo {
    background-color: var(--role-sudo-background-color);
    color: var(--role-sudo-text-color);
  }
</style>
