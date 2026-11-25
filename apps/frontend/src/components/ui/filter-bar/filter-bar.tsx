"use client";

import { useState, type ReactNode } from "react";
import { Box, Button, Flex, Input, InputGroup } from "@chakra-ui/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { FormField } from "@/components/ui/form-field";

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    maxLength?: number;
  };
  activeFilterCount: number;
  onClear: () => void;
  children: ReactNode;
}

/**
 * Search and filters of a list. On phones the filters fold behind a button that shows
 * how many are active.
 */
export function FilterBar({
  search,
  activeFilterCount,
  onClear,
  children,
}: FilterBarProps) {
  const [isOpenOnMobile, setIsOpenOnMobile] = useState(false);

  return (
    <Flex wrap="wrap" align="end" gap="3" mb="4">
      <Flex
        w={{ base: "full", md: "auto" }}
        align="end"
        gap="2"
        hideFrom={search ? undefined : "md"}
      >
        {search ? (
          <Box flex={{ base: "1", md: "none" }} w={{ md: "72" }}>
            <FormField label="Buscar">
              <InputGroup startElement={<Search size={16} />}>
                <Input
                  size="sm"
                  bg="bg.panel"
                  value={search.value}
                  onChange={(event) => search.onChange(event.target.value)}
                  placeholder={search.placeholder}
                  maxLength={search.maxLength}
                />
              </InputGroup>
            </FormField>
          </Box>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          bg="bg.panel"
          hideFrom="md"
          aria-expanded={isOpenOnMobile}
          onClick={() => setIsOpenOnMobile((isOpen) => !isOpen)}
        >
          <SlidersHorizontal />
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </Flex>

      <Box
        w={{ base: "full", md: "auto" }}
        display={{ base: isOpenOnMobile ? "flex" : "none", md: "contents" }}
        flexDirection="column"
        gap="3"
      >
        {children}
        {activeFilterCount > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            alignSelf={{ base: "start", md: "end" }}
            onClick={onClear}
          >
            <X /> Limpar ({activeFilterCount})
          </Button>
        ) : null}
      </Box>
    </Flex>
  );
}
