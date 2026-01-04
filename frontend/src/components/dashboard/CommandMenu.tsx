import { useNavigate } from 'react-router-dom'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Home, FileText } from 'lucide-react'

export function CommandMenu() {
  const navigate = useNavigate()

  const commands = [
    {
      title: 'Home',
      icon: Home,
      action: () => navigate('/dashboard'),
    },
    {
      title: 'Extractions',
      icon: FileText,
      action: () => navigate('/dashboard/extractions'),
    },
  ]

  return (
    <Command>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commands.map((command) => (
            <CommandItem
              key={command.title}
              onSelect={() => {
                command.action()
              }}
            >
              <command.icon className="mr-2 h-4 w-4" />
              <span>{command.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

