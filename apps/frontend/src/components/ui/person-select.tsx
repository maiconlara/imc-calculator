"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Combobox,
  Portal,
  Text,
  VStack,
  createListCollection,
  useFilter,
} from "@chakra-ui/react";
import { RotateCw } from "lucide-react";
import type { UserOption } from "@imc-calculator/shared";
import { pluralize } from "@/lib/formatters";
import { UserStatusIndicator } from "./badges";

const COMBOBOX_TRANSLATIONS = {
  triggerLabel: "Mostrar a lista",
  clearTriggerLabel: "Limpar a escolha",
  resultsCount: (count: number) => pluralize(count, "resultado"),
  noResults: "Nenhum resultado",
  loading: "Carregando a lista",
};

interface PersonSelectProps {
  people: readonly UserOption[];
  value: string | undefined;
  onChange: (personId: string | undefined) => void;
  placeholder: string;
  emptyMessage: string;
  isLoading: boolean;
  loadError: Error | null;
  onRetry: () => void;
  size?: "sm" | "md";
  invalid?: boolean;
  isInsideDialog?: boolean;
}

/**
 * Searchable person picker. The list is filtered during render from the typed text,
 * so it keeps working when the people arrive later from the API, and it shows the
 * four states of loaded data: loading, failed load with a retry, nobody registered
 * and nobody matching the typed name. A failed refresh keeps the people already
 * loaded selectable, so the error shows only when there is nobody to list.
 */
export function PersonSelect({
  people,
  value,
  onChange,
  placeholder,
  emptyMessage,
  isLoading,
  loadError,
  onRetry,
  size = "md",
  invalid = false,
  isInsideDialog = false,
}: PersonSelectProps) {
  const { contains } = useFilter({ sensitivity: "base" });
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const loadErrorWithoutPeople = people.length === 0 ? loadError : null;

  const peopleCollection = useMemo(
    () =>
      createListCollection({
        items: searchTerm
          ? people.filter((person) => contains(person.name, searchTerm))
          : [...people],
        itemToValue: (person) => person.id,
        itemToString: (person) => person.name,
      }),
    [people, searchTerm, contains],
  );

  const peopleList = (
    <Combobox.Positioner>
      <Combobox.Content maxH="64">
        <Combobox.Empty>
          <PersonSelectEmptyMessage
            isLoading={isLoading}
            loadError={loadErrorWithoutPeople}
            onRetry={onRetry}
            emptyMessage={people.length === 0 ? emptyMessage : "Ninguém com esse nome."}
          />
        </Combobox.Empty>
        {peopleCollection.items.map((person) => (
          <Combobox.Item key={person.id} item={person}>
            <Combobox.ItemText>{person.name}</Combobox.ItemText>
            {person.status === "inactive" ? (
              <UserStatusIndicator status="inactive" size="sm" />
            ) : null}
            <Combobox.ItemIndicator />
          </Combobox.Item>
        ))}
      </Combobox.Content>
    </Combobox.Positioner>
  );

  return (
    <Combobox.Root
      collection={peopleCollection}
      value={value ? [value] : []}
      onValueChange={(event) => {
        onChange(event.value[0]);
        setSearchTerm(null);
      }}
      onInputValueChange={(event) => {
        if (event.reason === "input-change") setSearchTerm(event.inputValue);
      }}
      onOpenChange={(event) => {
        if (!event.open) setSearchTerm(null);
      }}
      openOnClick
      inputBehavior="autohighlight"
      size={size}
      invalid={invalid || Boolean(loadErrorWithoutPeople)}
      loading={isLoading}
      translations={COMBOBOX_TRANSLATIONS}
    >
      <Combobox.Control>
        <Combobox.Input
          placeholder={
            loadErrorWithoutPeople ? "Não foi possível carregar a lista" : placeholder
          }
          bg="bg.panel"
        />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      {isInsideDialog ? peopleList : <Portal>{peopleList}</Portal>}
    </Combobox.Root>
  );
}

function PersonSelectEmptyMessage({
  isLoading,
  loadError,
  onRetry,
  emptyMessage,
}: {
  isLoading: boolean;
  loadError: Error | null;
  onRetry: () => void;
  emptyMessage: string;
}) {
  if (isLoading) return <Text>Carregando…</Text>;
  if (loadError) {
    return (
      <VStack align="start" gap="2">
        <Text>Não foi possível carregar a lista.</Text>
        <Button size="xs" variant="outline" onClick={onRetry}>
          <RotateCw /> Tentar de novo
        </Button>
      </VStack>
    );
  }
  return <Text>{emptyMessage}</Text>;
}
